using System;

namespace HanoiAir
{
    public delegate void AqiChanged (object sender, AqiChangedEventArgs e);

    public class AqiChangedEventArgs : EventArgs
    {
        private readonly double newAqi;
        private readonly double oldAqi;

        public AqiChangedEventArgs(double newAqi, double oldAqi) : base()
        {
            this.newAqi = newAqi;
            this.oldAqi = oldAqi;
        }

        public double NewAqi
        {
            get
            {
                return newAqi;
            }
        }

        public double OldAqi
        {
            get
            {
                return oldAqi;
            }
        }
    }
}

