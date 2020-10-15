import { JSONObject } from '@expo/json-file';
import { XcodeProject } from 'xcode';

import {
  ConfigModifierPlugin,
  ConfigPlugin,
  ExpoConfig,
  IOSPluginModifierProps,
} from '../Config.types';
import { ExpoPlist, InfoPlist } from '../ios/IosConfig.types';
import { withExtendedModifier } from './core-plugins';

type MutateInfoPlistAction = (expo: ExpoConfig, infoPlist: InfoPlist) => InfoPlist;

export function createInfoPlistPlugin(
  action: MutateInfoPlistAction
): ConfigPlugin<MutateInfoPlistAction> {
  return config =>
    withInfoPlist(config, async config => {
      config.props.data = await action(config.expo, config.props.data);
      return config;
    });
}

export const withInfoPlist: ConfigPlugin<ConfigModifierPlugin<
  IOSPluginModifierProps<InfoPlist>
>> = (config, action) => {
  return withExtendedModifier<IOSPluginModifierProps<InfoPlist>>(config, {
    platform: 'ios',
    modifier: 'infoPlist',
    async action(config) {
      config = await action(config);
      if (!config.expo.ios) {
        config.expo.ios = {};
      }
      config.expo.ios.infoPlist = config.props.data;
      return config;
    },
  });
};

export const withEntitlementsPlist: ConfigPlugin<ConfigModifierPlugin<
  IOSPluginModifierProps<JSONObject>
>> = (config, action) => {
  return withExtendedModifier<IOSPluginModifierProps<JSONObject>>(config, {
    platform: 'ios',
    modifier: 'entitlements',
    async action(config) {
      config = await action(config);
      if (!config.expo.ios) {
        config.expo.ios = {};
      }
      config.expo.ios.entitlements = config.props.data;
      return config;
    },
  });
};

export const withExpoPlist: ConfigPlugin<ConfigModifierPlugin<
  IOSPluginModifierProps<ExpoPlist>
>> = (config, action) => {
  return withExtendedModifier(config, {
    platform: 'ios',
    modifier: 'expoPlist',
    action,
  });
};

export const withXcodeProject: ConfigPlugin<ConfigModifierPlugin<
  IOSPluginModifierProps<XcodeProject>
>> = (config, action) => {
  return withExtendedModifier(config, {
    platform: 'ios',
    modifier: 'xcodeproj',
    action,
  });
};

export const withDangerousModifier: ConfigPlugin<ConfigModifierPlugin<
  IOSPluginModifierProps<unknown>
>> = (config, action) => {
  return withExtendedModifier(config, {
    platform: 'ios',
    modifier: 'dangerous',
    action,
  });
};