import plist, { PlistObject } from '@expo/plist';
import assert from 'assert';
import fs from 'fs-extra';
import xcode from 'xcode';

import { ConfigPlugin, ExpoConfig } from '../Config.types';
import { withDangerousModifier } from '../plugins/ios-plugins';
import { InfoPlist } from './IosConfig.types';
import { getAllInfoPlistPaths, getAllPBXProjectPaths, getPBXProjectPath } from './Paths';
import {
  ConfigurationSectionEntry,
  findFirstNativeTarget,
  getBuildConfigurationForId,
} from './utils/Xcodeproj';

export const withBundleIdentifier: ConfigPlugin<{ bundleIdentifier?: string }> = (
  config,
  { bundleIdentifier }
) => {
  return withDangerousModifier(config, async config => {
    const bundleId = bundleIdentifier ?? config.expo.ios?.bundleIdentifier;
    assert(
      bundleId,
      '`bundleIdentifier` must be defined in the app config (`expo.ios.bundleIdentifier`) or passed to the plugin `withBundleIdentifier`.'
    );
    await setBundleIdentifierForPbxproj(config.props.projectRoot, bundleId!);
    return config;
  });
};

function getBundleIdentifier(config: ExpoConfig): string | null {
  return config.ios?.bundleIdentifier ?? null;
}

/**
 * In Turtle v1 we set the bundleIdentifier directly on Info.plist rather
 * than in pbxproj
 */
function setBundleIdentifier(config: ExpoConfig, infoPlist: InfoPlist): InfoPlist {
  const bundleIdentifier = getBundleIdentifier(config);

  if (!bundleIdentifier) {
    return infoPlist;
  }

  return {
    ...infoPlist,
    CFBundleIdentifier: bundleIdentifier,
  };
}

/**
 * Gets the bundle identifier of the Xcode project found in the project directory.
 * If either the Xcode project doesn't exist or the project is not configured
 * this function returns null.
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @returns {string | null} bundle identifier of the Xcode project or null if the project is not configured
 */
function getBundleIdentifierFromPbxproj(projectRoot: string): string | null {
  let pbxprojPath: string;
  try {
    pbxprojPath = getPBXProjectPath(projectRoot);
  } catch {
    return null;
  }
  const project = xcode.project(pbxprojPath);
  project.parseSync();

  const nativeTarget = findFirstNativeTarget(project);

  for (const [, item] of getBuildConfigurationForId(project, nativeTarget.buildConfigurationList)) {
    const bundleIdentifierRaw = item.buildSettings.PRODUCT_BUNDLE_IDENTIFIER;
    if (bundleIdentifierRaw) {
      const bundleIdentifier =
        bundleIdentifierRaw[0] === '"' ? bundleIdentifierRaw.slice(1, -1) : bundleIdentifierRaw;
      // it's possible to use interpolation for the bundle identifier
      // the most common case is when the last part of the id is set to `$(PRODUCT_NAME:rfc1034identifier)`
      // in this case, PRODUCT_NAME should be replaced with its value
      // the `rfc1034identifier` modifier replaces all non-alphanumeric characters with dashes
      const bundleIdentifierParts = bundleIdentifier.split('.');
      if (
        bundleIdentifierParts[bundleIdentifierParts.length - 1] ===
          '$(PRODUCT_NAME:rfc1034identifier)' &&
        item.buildSettings.PRODUCT_NAME
      ) {
        bundleIdentifierParts[
          bundleIdentifierParts.length - 1
        ] = item.buildSettings.PRODUCT_NAME.replace(/[^a-zA-Z0-9]/g, '-');
      }
      return bundleIdentifierParts.join('.');
    }
  }
  return null;
}

/**
 * Updates the bundle identifier for a given pbxproj
 *
 * @param {string} pbxprojPath Path to pbxproj file
 * @param {string} bundleIdentifier Bundle identifier to set in the pbxproj
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
function updateBundleIdentifierForPbxproj(
  pbxprojPath: string,
  bundleIdentifier: string,
  updateProductName: boolean = true
): void {
  const project = xcode.project(pbxprojPath);
  project.parseSync();

  const nativeTarget = findFirstNativeTarget(project);

  getBuildConfigurationForId(project, nativeTarget.buildConfigurationList).forEach(
    ([, item]: ConfigurationSectionEntry) => {
      if (item.buildSettings.PRODUCT_BUNDLE_IDENTIFIER === bundleIdentifier) {
        return;
      }

      item.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleIdentifier}"`;

      if (updateProductName) {
        const productName = bundleIdentifier.split('.').pop();
        if (!productName?.includes('$')) {
          item.buildSettings.PRODUCT_NAME = productName;
        }
      }
    }
  );
  fs.writeFileSync(pbxprojPath, project.writeSync());
}

/**
 * Updates the bundle identifier for pbx projects inside the ios directory of the given project root
 *
 * @param {string} projectRoot Path to project root containing the ios directory
 * @param {string} bundleIdentifier Desired bundle identifier
 * @param {boolean} [updateProductName=true]  Whether to update PRODUCT_NAME
 */
function setBundleIdentifierForPbxproj(
  projectRoot: string,
  bundleIdentifier: string,
  updateProductName: boolean = true
): void {
  // Get all pbx projects in the ${projectRoot}/ios directory
  let pbxprojPaths: string[] = [];
  try {
    pbxprojPaths = getAllPBXProjectPaths(projectRoot);
  } catch {}

  for (const pbxprojPath of pbxprojPaths) {
    updateBundleIdentifierForPbxproj(pbxprojPath, bundleIdentifier, updateProductName);
  }
}

/**
 * Reset bundle identifier field in Info.plist to use PRODUCT_BUNDLE_IDENTIFIER, as recommended by Apple.
 */

const defaultBundleId = '$(PRODUCT_BUNDLE_IDENTIFIER)';

function resetAllPlistBundleIdentifiers(projectRoot: string): void {
  const infoPlistPaths = getAllInfoPlistPaths(projectRoot);

  for (const plistPath of infoPlistPaths) {
    resetPlistBundleIdentifier(plistPath);
  }
}

function resetPlistBundleIdentifier(plistPath: string): void {
  const rawPlist = fs.readFileSync(plistPath, 'utf8');
  const plistObject = plist.parse(rawPlist) as PlistObject;

  if (plistObject.CFBundleIdentifier) {
    if (plistObject.CFBundleIdentifier === defaultBundleId) return;

    // attempt to match default Info.plist format
    const format = { pretty: true, indent: `\t` };

    const xml = plist.build(
      {
        ...plistObject,
        CFBundleIdentifier: defaultBundleId,
      },
      format
    );

    if (xml !== rawPlist) {
      fs.writeFileSync(plistPath, xml);
    }
  }
}

export {
  getBundleIdentifier,
  setBundleIdentifier,
  getBundleIdentifierFromPbxproj,
  updateBundleIdentifierForPbxproj,
  setBundleIdentifierForPbxproj,
  resetAllPlistBundleIdentifiers,
  resetPlistBundleIdentifier,
};
