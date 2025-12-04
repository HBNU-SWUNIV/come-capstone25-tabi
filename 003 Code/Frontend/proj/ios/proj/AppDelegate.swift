import UIKit
import React
import React_RCTAppDelegate
#if canImport(ReactAppDependencyProvider)
import ReactAppDependencyProvider
#endif
import GoogleMaps

@main
class AppDelegate: RCTAppDelegate {
  override init() {
    super.init()
    // ✅ 네 앱 이름
    self.moduleName = "proj"
    self.initialProps = [:]

    // ✅ New Architecture + Codegen 환경에서만 주입 (모듈 없으면 생략)
    #if canImport(ReactAppDependencyProvider)
    self.dependencyProvider = RCTAppDependencyProvider()
    #endif
  }

  // ✅ 반드시 구현
  override func bundleURL() -> URL! {
    #if DEBUG
    // 개발: Metro 번들
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
    #else
    // 릴리즈: 사전 번들
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }

  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
  ) -> Bool {
    GMSServices.provideAPIKey("AIzaSyDV3d2I26rVwDBCKVdNsWrJTYmnYLev6mM")
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}