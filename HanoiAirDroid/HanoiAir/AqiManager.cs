using System;

namespace HanoiAir
{
    public class AqiManager
    {
        private AqiManager()
        {
        }
        static AqiManager()
        {
            instance = new AqiManager();
        }
        public static AqiManager Instance
        {
            get
            {
                return instance;
            }
        }
        private static AqiManager instance;


        public int GetImageForAqi(double aqi)
        {
            var imageToUse = Resource.Drawable.smiling;
            if (aqi >= 50)
            {
                imageToUse = Resource.Drawable.sad;
            }
            if (aqi >= 150)
            {
                imageToUse = Resource.Drawable.crying;
            }
            if (aqi >= 200)
            {
                imageToUse = Resource.Drawable.gasmask;
            }
            return imageToUse;
        }

        public int GetDescriptionForAqi(double aqi)
        {
            var textToUse = Resource.String.goodQuality;
            if (aqi >= 50)
            {
                textToUse = Resource.String.poorQuality;
            }
            if (aqi >= 150)
            {
                textToUse = Resource.String.badQuality;
            }
            if (aqi >= 200)
            {
                textToUse = Resource.String.terribleQuality;
            }
            return textToUse;
        }

        public int GetAdviceForAqi(double aqi)
        {
            var textToUse = Resource.String.goodAdvice;
            if (aqi >= 50)
            {
                textToUse = Resource.String.poorAdvice;
            }
            if (aqi >= 150)
            {
                textToUse = Resource.String.badAdvice;
            }
            if (aqi >= 200)
            {
                textToUse = Resource.String.terribleAdvice;
            }
            return textToUse;
        }

        public int GetDescriptionForForecast(double forecast)
        {
            var textToUse = Resource.String.forecastDown;
            if (forecast >= -10)
            {
                textToUse = Resource.String.forecastSameOrDown;
            }
            if (forecast >= -5)
            {
                textToUse = Resource.String.forecastSame;
            }
            if (forecast >= 5)
            {
                textToUse = Resource.String.forecastSameOrUp;
            }
            if (forecast >= 10)
            {
                textToUse = Resource.String.forecastUp;
            }
            return textToUse;
        }

        public void UpdateAqi(double newAqi, double oldAqi)
        {
            AqiChanged(this, new AqiChangedEventArgs(newAqi, oldAqi));
        }

        public event AqiChanged AqiChanged = delegate{};
    }
}

