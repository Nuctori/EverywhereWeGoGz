import argparse
import json
import os
import pathlib
import shlex
import subprocess
import tempfile


REMOTE_SCRIPT = pathlib.Path(__file__).with_name('run_remote_wechat_sup_orders.py')


def run(command, input_data=None):
    subprocess.run(command, check=True, input=input_data)


def capture(command):
    completed = subprocess.run(command, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8', errors='replace')
    return completed.stdout.strip()


def build_remote_command(remote_dir, remote_script_path, remote_check_path, remote_result_path, remote_env_path, execute):
    return 'cd {directory} && python3 {script} --check-result {check} --output {output} --execute {execute} --env-file {env_file}'.format(
        directory=shlex.quote(remote_dir),
        script=shlex.quote(remote_script_path),
        check=shlex.quote(remote_check_path),
        output=shlex.quote(remote_result_path),
        execute=shlex.quote(execute),
        env_file=shlex.quote(remote_env_path),
    )


def build_remote_env(app_id, app_secret, base_url):
    return f'SUP_APP_ID={app_id}\nSUP_APP_SECRET={app_secret}\nSUP_API_BASE_URL={base_url}\n'.encode('utf-8')


def build_remote_cleanup_command(remote_script_path, remote_check_path, remote_result_path, remote_env_path):
    return 'rm -f {script} {check} {output} {env_file}'.format(
        script=shlex.quote(remote_script_path),
        check=shlex.quote(remote_check_path),
        output=shlex.quote(remote_result_path),
        env_file=shlex.quote(remote_env_path),
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', required=True)
    parser.add_argument('--remote-dir', required=True)
    parser.add_argument('--check-result', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--execute', choices=('true', 'false'), required=True)
    args = parser.parse_args()

    remote_dir = args.remote_dir.rstrip('/')
    remote_script_path = f'{remote_dir}/run_remote_wechat_sup_orders.py'
    remote_check_path = f'{remote_dir}/check-result.json'
    remote_result_path = f'{remote_dir}/sup-result.json'
    remote_env_path = f'{remote_dir}/sup.env'
    completed_order_keys = os.environ.get('COMPLETED_ORDER_KEYS', '')
    check_result = json.loads(pathlib.Path(args.check_result).read_text(encoding='utf-8'))
    check_result['completedOrderKeys'] = parse_completed_order_keys(completed_order_keys)

    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as check_file:
        check_file.write(json.dumps(check_result, ensure_ascii=False) + '\n')
        local_check_path = check_file.name

    try:
        run(['ssh', args.host, f'mkdir -p {shlex.quote(remote_dir)}'])
        run(['scp', str(REMOTE_SCRIPT), f'{args.host}:{remote_script_path}'])
        run(['scp', local_check_path, f'{args.host}:{remote_check_path}'])
        run(
            ['ssh', args.host, f'umask 077 && cat > {shlex.quote(remote_env_path)}'],
            input_data=build_remote_env(
                os.environ.get('SUP_APP_ID', ''),
                os.environ.get('SUP_APP_SECRET', ''),
                os.environ.get('SUP_API_BASE_URL', 'https://sup.yileyuns.com'),
            ),
        )
        remote_command = build_remote_command(
            remote_dir,
            remote_script_path,
            remote_check_path,
            remote_result_path,
            remote_env_path,
            args.execute,
        )
        result = capture(['ssh', args.host, remote_command])
        run(['scp', f'{args.host}:{remote_result_path}', args.output])
        print(result)
    finally:
        pathlib.Path(local_check_path).unlink(missing_ok=True)
        cleanup = build_remote_cleanup_command(
            remote_script_path,
            remote_check_path,
            remote_result_path,
            remote_env_path,
        )
        try:
            run(['ssh', args.host, cleanup])
        except subprocess.CalledProcessError:
            pass


def parse_completed_order_keys(value):
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(item) for item in parsed if item]
    except json.JSONDecodeError:
        return [item.strip() for item in value.split(',') if item.strip()]
    return []


if __name__ == '__main__':
    main()
