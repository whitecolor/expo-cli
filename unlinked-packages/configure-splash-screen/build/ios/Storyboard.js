'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const path_1 = __importDefault(require('path'));

const constants_1 = require('../constants');
const file_utils_1 = require('../utils/file-utils');
const xcode_1 = require('../xcode');
const STORYBOARD_FILE_PATH = './SplashScreen.storyboard';
/**
 * Modifies `.pbxproj` by:
 * - adding reference for `.storyboard` file
 */
function updatePbxProject({ projectName, pbxProject, applicationNativeTarget }) {
  // Check if `${projectName}/SplashScreen.storyboard` already exists
  // Path relative to `ios` directory
  const storyboardFilePath = path_1.default.join(projectName, STORYBOARD_FILE_PATH);
  if (!pbxProject.hasFile(storyboardFilePath)) {
    const group = pbxProject.findPBXGroupKey({ name: projectName });
    if (!group) {
      throw new Error(`Couldn't locate proper PBXGroup '.xcodeproj' file.`);
    }
    xcode_1.addStoryboardFileToProject(pbxProject, storyboardFilePath, {
      target: applicationNativeTarget.uuid,
      group,
    });
  }
}
/**
 * Creates [STORYBOARD] file containing ui description of Splash/Launch Screen.
 * > WARNING: modifies `pbxproj`
 */
async function configureStoryboard(iosProject, config = {}) {
  var _a;
  const resizeMode =
    (_a = config.imageResizeMode) !== null && _a !== void 0
      ? _a
      : constants_1.SplashScreenImageResizeMode.CONTAIN;
  const splashScreenImagePresent = Boolean(config.image);
  let contentMode;
  switch (resizeMode) {
    case constants_1.SplashScreenImageResizeMode.CONTAIN:
      contentMode = 'scaleAspectFit';
      break;
    case constants_1.SplashScreenImageResizeMode.COVER:
      contentMode = 'scaleAspectFill';
      break;
    default:
      throw new Error(`resizeMode = ${resizeMode} is not supported for iOS platform.`);
  }
  const filePath = path_1.default.resolve(iosProject.projectPath, STORYBOARD_FILE_PATH);
  await file_utils_1.createDirAndWriteFile(
    filePath,
    `<?xml version="1.0" encoding="UTF-8"?>
<document
  type="com.apple.InterfaceBuilder3.CocoaTouch.Storyboard.XIB"
  version="3.0"
  toolsVersion="16096"
  targetRuntime="iOS.CocoaTouch"
  propertyAccessControl="none"
  useAutolayout="YES"
  launchScreen="YES"
  useTraitCollections="YES"
  useSafeAreas="YES"
  colorMatched="YES"
  initialViewController="EXPO-VIEWCONTROLLER-1"
>
  <device id="retina5_5" orientation="portrait" appearance="light"/>
  <dependencies>
    <deployment identifier="iOS"/>
    <plugIn identifier="com.apple.InterfaceBuilder.IBCocoaTouchPlugin" version="16087"/>
    <capability name="Safe area layout guides" minToolsVersion="9.0"/>
    <capability name="documents saved in the Xcode 8 format" minToolsVersion="8.0"/>
  </dependencies>
  <scenes>
    <!--View Controller-->
    <scene sceneID="EXPO-SCENE-1">
      <objects>
        <viewController
          storyboardIdentifier="SplashScreenViewController"
          id="EXPO-VIEWCONTROLLER-1"
          sceneMemberID="viewController"
        >
          <view
            key="view"
            userInteractionEnabled="NO"
            contentMode="scaleToFill"
            insetsLayoutMarginsFromSafeArea="NO"
            id="EXPO-ContainerView"
            userLabel="ContainerView"
          >
            <rect key="frame" x="0.0" y="0.0" width="414" height="736"/>
            <autoresizingMask key="autoresizingMask" flexibleMaxX="YES" flexibleMaxY="YES"/>
            <subviews>
              <imageView
                userInteractionEnabled="NO"
                contentMode="scaleAspectFill"
                horizontalHuggingPriority="251"
                verticalHuggingPriority="251"
                insetsLayoutMarginsFromSafeArea="NO"
                image="SplashScreenBackground"
                translatesAutoresizingMaskIntoConstraints="NO"
                id="EXPO-SplashScreenBackground"
                userLabel="SplashScreenBackground"
              >
                <rect key="frame" x="0.0" y="0.0" width="414" height="736"/>
              </imageView>${
                !splashScreenImagePresent
                  ? ''
                  : `
              <imageView
                clipsSubviews="YES"
                userInteractionEnabled="NO"
                contentMode="${contentMode}"
                horizontalHuggingPriority="251"
                verticalHuggingPriority="251"
                translatesAutoresizingMaskIntoConstraints="NO"
                image="SplashScreen"
                id="EXPO-SplashScreen"
                userLabel="SplashScreen"
              >
                <rect key="frame" x="0.0" y="0.0" width="414" height="736"/>
              </imageView>`
              }
            </subviews>
            <constraints>
              <constraint firstItem="EXPO-SplashScreenBackground" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="1gX-mQ-vu6"/>
              <constraint firstItem="EXPO-SplashScreenBackground" firstAttribute="leading" secondItem="EXPO-ContainerView" secondAttribute="leading" id="6tX-OG-Sck"/>
              <constraint firstItem="EXPO-SplashScreenBackground" firstAttribute="trailing" secondItem="EXPO-ContainerView" secondAttribute="trailing" id="ABX-8g-7v4"/>
              <constraint firstItem="EXPO-SplashScreenBackground" firstAttribute="bottom" secondItem="EXPO-ContainerView" secondAttribute="bottom" id="jkI-2V-eW5"/>${
                !splashScreenImagePresent
                  ? ''
                  : `
              <constraint firstItem="EXPO-SplashScreen" firstAttribute="top" secondItem="EXPO-ContainerView" secondAttribute="top" id="2VS-Uz-0LU"/>
              <constraint firstItem="EXPO-SplashScreen" firstAttribute="leading" secondItem="EXPO-ContainerView" secondAttribute="leading" id="LhH-Ei-DKo"/>
              <constraint firstItem="EXPO-SplashScreen" firstAttribute="trailing" secondItem="EXPO-ContainerView" secondAttribute="trailing" id="I6l-TP-6fn"/>
              <constraint firstItem="EXPO-SplashScreen" firstAttribute="bottom" secondItem="EXPO-ContainerView" secondAttribute="bottom" id="nbp-HC-eaG"/>`
              }
            </constraints>
            <viewLayoutGuide key="safeArea" id="Rmq-lb-GrQ"/>
          </view>
        </viewController>
        <placeholder placeholderIdentifier="IBFirstResponder" id="EXPO-PLACEHOLDER-1" userLabel="First Responder" sceneMemberID="firstResponder"/>
      </objects>
      <point key="canvasLocation" x="140.625" y="129.4921875"/>
    </scene>
  </scenes>
  <resources>${
    !splashScreenImagePresent
      ? ''
      : `
    <image name="SplashScreen" width="414" height="736"/>`
  }
    <image name="SplashScreenBackground" width="1" height="1"/>
  </resources>
</document>
`
  );
  await updatePbxProject(iosProject);
}
exports.default = configureStoryboard;
//# sourceMappingURL=Storyboard.js.map
