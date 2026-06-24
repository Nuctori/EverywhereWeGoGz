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
import re


def request_json(url, method='GET', data=None, headers=None):
    request = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = response.read().decode('utf-8')
    return json.loads(payload)


def request_bytes(url):
    with urllib.request.urlopen(url, timeout=30) as response:
        return response.read(), response.headers.get_content_type()


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


def multipart_bytes(field_name, file_name, file_bytes, mime_type):
    boundary = '----CodexBoundary%s' % uuid.uuid4().hex
    body = []
    body.append(('--%s\r\n' % boundary).encode('utf-8'))
    body.append(('Content-Disposition: form-data; name="%s"; filename="%s"\r\n' % (field_name, file_name)).encode('utf-8'))
    body.append(('Content-Type: %s\r\n\r\n' % mime_type).encode('utf-8'))
    body.append(file_bytes)
    body.append(b'\r\n')
    body.append(('--%s--\r\n' % boundary).encode('utf-8'))
    return boundary, b''.join(body)


def upload_inline_image(access_token, image_url):
    image_bytes, mime_type = request_bytes(image_url)
    extension = mimetypes.guess_extension(mime_type or 'image/jpeg') or '.jpg'
    upload_url = 'https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=%s' % urllib.parse.quote(access_token)
    boundary, body = multipart_bytes('media', 'inline%s' % extension, image_bytes, mime_type or 'image/jpeg')
    data = request_json(
        upload_url,
        method='POST',
        data=body,
        headers={'Content-Type': 'multipart/form-data; boundary=%s' % boundary},
    )
    uploaded_url = data.get('url')
    if not uploaded_url:
        raise RuntimeError('inline image url missing: %s' % json.dumps(data, ensure_ascii=False))
    return uploaded_url


def replace_inline_images(access_token, html):
    image_urls = re.findall(r'<img\s+[^>]*src="(https?://[^"]+)"[^>]*>', html, flags=re.IGNORECASE)
    replacements = {}
    for original_url in image_urls:
      if original_url in replacements:
          continue
      replacements[original_url] = upload_inline_image(access_token, original_url)
    for original_url, uploaded_url in replacements.items():
        html = html.replace(original_url, uploaded_url)
    return html, replacements


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
    html, uploaded_images = replace_inline_images(access_token, html)
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
        'inlineImageCount': len(uploaded_images),
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
    try:
        completed = subprocess.run(
            cmd,
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='replace',
        )
    except subprocess.CalledProcessError as error:
        if error.stdout:
            print(error.stdout, file=sys.stderr, end='' if error.stdout.endswith('\n') else '\n')
        if error.stderr:
            print(error.stderr, file=sys.stderr, end='' if error.stderr.endswith('\n') else '\n')
        raise
    return completed.stdout.strip()


def remote_bundle_path(remote_dir, original_path, default_name):
    source_name = pathlib.Path(original_path).name if original_path else default_name
    return f'{remote_dir}/{source_name or default_name}'


def normalize_bundle_for_remote(bundle, remote_dir):
    normalized = dict(bundle)
    normalized['htmlPath'] = remote_bundle_path(remote_dir, bundle.get('htmlPath'), 'article.html')
    normalized['uploadCoverPath'] = remote_bundle_path(remote_dir, bundle.get('uploadCoverPath'), 'cover-upload.jpg')
    return normalized


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
    run(['scp', args.html_path, f'{args.host}:{remote_dir}/article.html'])
    run(['scp', args.cover_path, f'{args.host}:{remote_dir}/cover-upload.jpg'])

    bundle = json.loads(pathlib.Path(args.bundle_path).read_text(encoding='utf-8'))
    normalized_bundle = normalize_bundle_for_remote(bundle, remote_dir)

    try:
        with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as bundle_handle:
            bundle_handle.write(json.dumps(normalized_bundle, ensure_ascii=False, indent=2) + '\n')
            local_bundle = bundle_handle.name
        with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False, encoding='utf-8') as handle:
            handle.write(textwrap.dedent(REMOTE_SCRIPT))
            local_script = handle.name

        run(['scp', local_bundle, f'{args.host}:{remote_dir}/publish-bundle.json'])
        run(['scp', local_script, f'{args.host}:{remote_dir}/remote_publish.py'])
    finally:
        if 'local_bundle' in locals():
            pathlib.Path(local_bundle).unlink(missing_ok=True)
        if 'local_script' in locals():
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
