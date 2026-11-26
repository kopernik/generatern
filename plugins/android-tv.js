const { AndroidConfig, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs/promises');
const path = require('node:path');

module.exports = function androidTv(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    const features = (manifest['uses-feature'] ??= []);
    for (const name of ['android.software.leanback', 'android.hardware.touchscreen']) {
      let feature = features.find((entry) => entry.$['android:name'] === name);
      if (!feature) {
        feature = { $: { 'android:name': name } };
        features.push(feature);
      }
      feature.$['android:required'] = 'false';
    }
    application.$['android:banner'] = '@drawable/tv_banner';
    const launcher = activity['intent-filter'].find((filter) =>
      filter.category?.some((item) => item.$['android:name'] === 'android.intent.category.LAUNCHER'));
    const category = 'android.intent.category.LEANBACK_LAUNCHER';
    if (!launcher.category.some((item) => item.$['android:name'] === category)) {
      launcher.category.push({ $: { 'android:name': category } });
    }
    return config;
  });
  return withDangerousMod(config, ['android', async (config) => {
    const resources = path.join(config.modRequest.platformProjectRoot, 'app/src/main/res/drawable-xhdpi');
    await fs.mkdir(resources, { recursive: true });
    await fs.copyFile(path.join(config.modRequest.projectRoot, 'assets/images/tv-banner.png'), path.join(resources, 'tv_banner.png'));
    return config;
  }]);
};
