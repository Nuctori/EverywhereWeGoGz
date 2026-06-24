import argparse
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import textwrap


REMOTE_SCRIPT = r"""
import json
import mimetypes
import os
import pathlib
import sys
import urllib.parse
import urllib.request
import uuid


def request_json(url, method='GET', data=None, headers=None):
    request = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = response.read().decode('utf-8')
    return json.loads(payload)


def multipart_body(field_name, file_path):
    boundary = '----CodexBoundary%s' % uuid.uuid4().hex
    mime_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
    file_name = pathlib.Path(file_path).name
    file_bytes = pathlib.Path(file_path).read_bytes()
    body = []
    body.append(('--%s\r\n' % boundary).encode('utf-8'))
    body.append(('Content-Disposition: form-data; name="%s"; filename="%s"\r\n' % (field_name, file_name)).encode('utf-8'))
    body.append(('Content-Type: %s\r\n\r\n' % mime_type).encode('utf-8'))
    body.append(file_bytes)
    body.append(b'\r\n')
    body.append(('--%s--\r\n' % boundary).encode('utf-8'))
    return boundary, b''.join(body)


def main():
    bundle_path = pathlib.Path(sys.argv[1])
    bundle = json.loads(bundle_path.read_text(encoding='utf-8'))
    app_id = os.environ['WECHAT_APP_ID'].strip()
    app_secret = os.environ['WECHAT_APP_SECRET'].strip()

    token_url = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s' % (
        urllib.parse.quote(app_id),
        urllib.parse.quote(app_secret),
    )
    token_data = request_json(token_url)
    access_token = token_data.get('access_token')
    if not access_token:
        raise RuntimeError('access_token missing: %s' % json.dumps(token_data, ensure_ascii=False))

    media_url = 'https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=%s&type=image' % urllib.parse.quote(access_token)
    boundary, media_body = multipart_body('media', bundle['uploadCoverPath'])
    media_data = request_json(
        media_url,
        method='POST',
        data=media_body,
        headers={'Content-Type': 'multipart/form-data; boundary=%s' % boundary},
    )
    media_id = media_data.get('media_id')
    if not media_id:
        raise RuntimeError('media_id missing: %s' % json.dumps(media_data, ensure_ascii=False))

    html = pathlib.Path(bundle['htmlPath']).read_text(encoding='utf-8')
    payload = {
        'articles': [
            {
                'title': bundle['title'],
                'author': bundle.get('author') or '老广去边度',
                'digest': bundle.get('summary') or '',
                'content': html,
                'content_source_url': bundle.get('sourceUrl') or '',
                'thumb_media_id': media_id,
                'need_open_comment': 1 if bundle.get('commentsOpen', True) else 0,
                'only_fans_can_comment': 1 if bundle.get('fansOnly', False) else 0,
            }
        ]
    }

    draft_url = 'https://api.weixin.qq.com/cgi-bin/draft/add?access_token=%s' % urllib.parse.quote(access_token)
    draft_data = request_json(
        draft_url,
        method='POST',
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
    )
    media_id_result = draft_data.get('media_id')
    if not media_id_result:
        raise RuntimeError('draft media_id missing: %s' % json.dumps(draft_data, ensure_ascii=False))

    result = {
        'publishedAt': bundle.get('generatedAt'),
        'mediaId': media_id_result,
        'thumbMediaId': media_id,
        'title': bundle['title'],
    }
    result_path = bundle_path.parent / 'publish-result.json'
    result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
"""


def run(cmd):
    subprocess.run(cmd, check=True)


def capture(cmd):
    completed = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return completed.stdout.strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', required=True)
    parser.add_argument('--remote-dir', required=True)
    parser.add_argument('--bundle-path', required=True)
    parser.add_argument('--html-path', required=True)
    parser.add_argument('--cover-path', required=True)
    parser.add_argument('--app-id', required=True)
    parser.add_argument('--app-secret', required=True)
    args = parser.parse_args()

    remote_dir = args.remote_dir.rstrip('/')
    run(['ssh', args.host, f'mkdir -p {remote_dir}'])
    run(['scp', args.bundle_path, f'{args.host}:{remote_dir}/publish-bundle.json'])
    run(['scp', args.html_path, f'{args.host}:{remote_dir}/article.html'])
    run(['scp', args.cover_path, f'{args.host}:{remote_dir}/cover-upload.jpg'])

    with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False, encoding='utf-8') as handle:
      handle.write(textwrap.dedent(REMOTE_SCRIPT))
      local_script = handle.name

    try:
      run(['scp', local_script, f'{args.host}:{remote_dir}/remote_publish.py'])
    finally:
      pathlib.Path(local_script).unlink(missing_ok=True)

    remote_command = (
        f"cd {remote_dir} && "
        f"WECHAT_APP_ID={json.dumps(args.app_id)} "
        f"WECHAT_APP_SECRET={json.dumps(args.app_secret)} "
        f"python3 remote_publish.py publish-bundle.json"
    )
    result = capture(['ssh', args.host, remote_command])
    print(result)


if __name__ == '__main__':
    main()
