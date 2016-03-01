using Xamarin;
using System;
using Android.App;
using Android.Runtime;
using Parse;

namespace HanoiAir
{
    [Application(Name="hanoiair.App")]
    public class App : Application
    {
        public App (IntPtr javaReference, JniHandleOwnership transfer) : base(javaReference, transfer)
        {
        }

        public override void OnCreate ()
        {
            base.OnCreate ();
            // Initialize the Parse client with your Application ID and .NET Key found on
            // your Parse dashboard
            ParseClient.Initialize ("zuB5mkU1etDB5YjR7Vtgl0SNjBQJ9DSw2lNIbhCQ", "3bwximQPaYUwihGcx3uqpwzr7S43ODH3Pf8OLkwK");

            //ParsePush.ParsePushNotificationReceived += ParsePush.DefaultParsePushNotificationReceivedHandler;
            ParsePush.ParsePushNotificationReceived += (object sender, ParsePushNotificationEventArgs e) => {
                // Instantiate the builder and set notification elements:



                Notification.Builder builder = new Notification.Builder (this)
                    .SetContentTitle (e.Payload["title"].ToString())
                    .SetContentText (e.Payload["alert"].ToString())
                    .SetSmallIcon (AqiManager.Instance.GetImageForAqi((double)e.Payload["aqi"]));

                // Build the notification:
                var notification = builder.Build();

                // Get the notification manager:
                NotificationManager notificationManager =
                    GetSystemService (Android.Content.Context.NotificationService) as NotificationManager;

                // Publish the notification:
                const int notificationId = 0;
                notificationManager.Notify (notificationId, notification);

                AqiManager.Instance.UpdateAqi((double)e.Payload["aqi"], (double)e.Payload["lastAqi"]);
            };
            if (Parse.ParseInstallation.CurrentInstallation.Channels == null)
            {
                ParsePush.SubscribeAsync("AQIAlerts").Wait();
                Parse.ParseInstallation.CurrentInstallation.SaveAsync().Wait();
            }
            else
            {
                Parse.ParseInstallation.CurrentInstallation.SaveAsync();
            }
                
        }
    }

}

