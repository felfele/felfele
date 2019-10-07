#import "RNConfig.h"

@implementation RNConfig

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport
{
  NSString* buildEnvironment = [[[NSBundle mainBundle] infoDictionary] valueForKey:@"BuildEnvironment"];
  NSString* appGroup = [[[NSBundle mainBundle] infoDictionary] valueForKey:@"AppGroup"];
  return @{
    @"buildEnvironment": buildEnvironment,
    @"appGroup": appGroup,
  };
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
