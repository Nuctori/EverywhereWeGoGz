import importlib.util
import pathlib
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


if __name__ == '__main__':
    unittest.main()
