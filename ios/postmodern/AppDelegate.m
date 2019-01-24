/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import <Geth/Geth.h>

BOOL InitSwarm()
{
  NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString *dataDir = [paths objectAtIndex:0];
  NSString *keystoreDir = [NSString stringWithFormat:@"%@/keystore", dataDir];
  
  GethKeyStore *keyStore = GethNewKeyStore(keystoreDir, GethStandardScryptN, GethStandardScryptP);
  NSString *password = @"password";
  
  NSError *error;
  GethAccount *account = [keyStore newAccount:password error:&error];
  if (error != nil) {
    NSString *message = [NSString stringWithFormat:@"newAccount %@", [error localizedDescription]];
    NSLog(@"%@", message);
    return FALSE;
  }
  
  GethNodeConfig *config = GethNewNodeConfig();
  [config setEthereumEnabled:false];
  [config setWhisperEnabled:false];
  
  [config setSwarmEnabled:true];
  NSString *hex = [[account getAddress] getHex];
  [config setSwarmAccount:hex];
  [config setSwarmAccountPassword:password];
  
  NSError* newNodeError = nil;
  GethNode *node = GethNewNode(dataDir, config, &newNodeError);
  if (newNodeError != nil) {
    NSString *message = [NSString stringWithFormat:@"GethNewNode %@", [newNodeError localizedDescription]];
    NSLog(@"%@", message);
    return FALSE;
  }
  
  NSError *nodeStartError = nil;
  [node start:&nodeStartError];
  if (nodeStartError != nil) {
    NSString *message = [NSString stringWithFormat:@"node start %@", [nodeStartError localizedDescription]];
    NSLog(@"%@", message);
    return FALSE;
  }
  
  return TRUE;
}

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSURL *jsCodeLocation;

#if DEBUG
 jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index.ios" fallbackResource:nil];
#else
  jsCodeLocation = [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif

  RCTRootView *rootView = [[RCTRootView alloc] initWithBundleURL:jsCodeLocation
                                                      moduleName:@"postmodern"
                                               initialProperties:nil
                                                   launchOptions:launchOptions];
  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  InitSwarm();
  
  return YES;
}

@end
