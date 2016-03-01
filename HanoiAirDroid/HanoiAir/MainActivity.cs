using Android.App;
using Android.Widget;
using Android.OS;
using Parse;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xamarin;
namespace HanoiAir
{
    [Activity(Label = "Hanoi Air", MainLauncher = true, Icon = "@mipmap/ic_launcher")]
    public class MainActivity : Activity
    {
        protected override void OnCreate(Bundle savedInstanceState)
        {
            base.OnCreate(savedInstanceState);
            Insights.Initialize("55048377c0ef9e57724522856ea290ad4a310e8e", this);

            // Set our view from the "main" layout resource
            SetContentView(Resource.Layout.Main);

            // Get our button from the layout resource,
            // and attach an event to it
            CheckBox alertCheckbox = FindViewById<CheckBox>(Resource.Id.getAlerts);
           
            alertCheckbox.Checked = IsSubscribedToAlerts();
            alertCheckbox.CheckedChange += async (sender, e) => {
                var installation = ParseInstallation.CurrentInstallation;

                if (e.IsChecked)
                {
                    await ParsePush.SubscribeAsync("AQIAlerts");
                }
                else
                {
                    await ParsePush.UnsubscribeAsync("AQIAlerts");
                }
                installation.SaveAsync().Wait();
            };

            var refreshButton = FindViewById<Button>(Resource.Id.refreshStatus);
            refreshButton.Click += async (sender, e) => await RefreshStatusAsync();

            RefreshStatus();
            AqiManager.Instance.AqiChanged += (sender, e) => SetStatus(e.NewAqi);
        }

        private bool IsSubscribedToAlerts()
        {
            
            var installation = ParseInstallation.CurrentInstallation;

            return installation.Channels.Contains("AQIAlerts");
        }
        private void RefreshStatus()
        {
            ParseQuery<ParseObject> query = ParseObject.GetQuery("AirQualityCalculation");
            query = query.OrderByDescending("createdAt");
            query = query.Limit(1);
            var results = query.FindAsync().Result;
            var result = results.FirstOrDefault();
            var aqi = result.Get<double>("aqi");
            //    var concentration = result.Get<double>("particleMass");
            SetStatus(aqi);

            ParseQuery<ParseObject> forecastQuery = ParseObject.GetQuery("Forecast");
            forecastQuery = forecastQuery.OrderByDescending("createdAt");
            forecastQuery = forecastQuery.Limit(1);
            var forecastResults = forecastQuery.FindAsync().Result;
            var forecast = forecastResults.FirstOrDefault();

            var forecastValue = forecast.Get<double>("forecast");
            
        }
        private async Task RefreshStatusAsync()
        {
            ParseQuery<ParseObject> query = ParseObject.GetQuery("AirQualityCalculation");
            query = query.OrderByDescending("createdAt");
            query = query.Limit(1);
            var results = await query.FindAsync();
            var result = results.FirstOrDefault();
            var aqi = result.Get<double>("aqi");
        //    var concentration = result.Get<double>("particleMass");
            SetStatus(aqi);

//            ParseQuery<ParseObject> forecastQuery = ParseObject.GetQuery("Forecast");
//            forecastQuery = forecastQuery.OrderByDescending("createdAt");
//            forecastQuery = forecastQuery.Limit(1);
//            var forecastResults = await forecastQuery.FindAsync();
//            var forecast = forecastResults.FirstOrDefault();
//
//            var forecastValue = forecast.Get<double>("forecast");
           // SetForecast(forecastValue);
        }

        private void SetStatus(double aqi)
        {
            var text = FindViewById<TextView>(Resource.Id.aqiValue);

            var descriptionFormat = GetString(@Resource.String.descriptionFormat);
            var description = descriptionFormat.Replace("{description}", GetString(AqiManager.Instance.GetDescriptionForAqi(aqi)))
                .Replace("{aqi}", aqi.ToString("F0"));

            text.SetText(description, TextView.BufferType.Normal);

            var adviceText = FindViewById<TextView>(Resource.Id.adviceText);
            adviceText.SetText(AqiManager.Instance.GetAdviceForAqi(aqi));

//            var statusImage = FindViewById<ImageView>(Resource.Id.statusImage);
//            statusImage.SetImageResource(AqiManager.Instance.GetImageForAqi(aqi));

            var gauge = FindViewById<GaugeView>(Resource.Id.gauge);
            gauge.Value = (float)aqi;
        }

        private void SetForecast(double forecast)
        {
            var text = FindViewById<TextView>(Resource.Id.forecast);
            var descriptionFormat = GetString(@Resource.String.descriptionFormat);
            var description = descriptionFormat.Replace("{forecast}", GetString(AqiManager.Instance.GetDescriptionForForecast(forecast)));
            text.SetText(description, TextView.BufferType.Normal);
        }

    }
}


