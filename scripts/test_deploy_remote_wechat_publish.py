import importlib.util
import pathlib
import tempfile
import unittest


SCRIPT_PATH = pathlib.Path(__file__).with_name('deploy_remote_wechat_publish.py')
SPEC = importlib.util.spec_from_file_location('deploy_remote_wechat_publish', SCRIPT_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


class DeployRemoteWechatPublishTests(unittest.TestCase):
    def test_normalize_bundle_for_remote_rewrites_runner_paths(self):
        bundle = {
            'htmlPath': '/home/runner/work/EverywhereWeGoGz/EverywhereWeGoGz/weekly-wechat-posts/2026-06-24/article.html',
            'uploadCoverPath': '/home/runner/work/EverywhereWeGoGz/EverywhereWeGoGz/weekly-wechat-posts/2026-06-24/cover-upload.jpg',
            'title': '示例标题',
        }

        normalized = MODULE.normalize_bundle_for_remote(bundle, '/root/wechat-publish/2026-06-24')

        self.assertEqual(normalized['htmlPath'], '/root/wechat-publish/2026-06-24/article.html')
        self.assertEqual(normalized['uploadCoverPath'], '/root/wechat-publish/2026-06-24/cover-upload.jpg')
        self.assertEqual(normalized['title'], '示例标题')

    def test_collect_support_directories_finds_wechat_assets_and_qr(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            article_dir = pathlib.Path(temp_dir)
            html_path = article_dir / 'article.html'
            html_path.write_text('<p>stub</p>\n', encoding='utf-8')
            (article_dir / 'wechat-assets').mkdir()
            (article_dir / 'qr').mkdir()

            support_dirs = MODULE.collect_support_directories(str(html_path))

            self.assertEqual(
                [path.name for path in support_dirs],
                ['wechat-assets', 'qr'],
            )

    def test_remote_script_rewrites_inline_images_before_draft_add(self):
        self.assertIn('/media/uploadimg', MODULE.REMOTE_SCRIPT)
        self.assertIn('article.wechat.html', MODULE.REMOTE_SCRIPT)
        self.assertIn('rewrite_html_images', MODULE.REMOTE_SCRIPT)
        self.assertIn("mimetypes.guess_type(str(file_path))", MODULE.REMOTE_SCRIPT)

    def test_support_files_copy_into_existing_remote_directory(self):
        script = pathlib.Path(SCRIPT_PATH).read_text(encoding='utf-8')
        self.assertIn("mkdir -p {remote_support_dir}", script)
        self.assertIn("f'{support_dir}/.'", script)


if __name__ == '__main__':
    unittest.main()
