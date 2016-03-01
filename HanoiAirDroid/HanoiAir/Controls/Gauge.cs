
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

using Android.App;
using Android.Content;
using Android.OS;
using Android.Runtime;
using Android.Util;
using Android.Views;
using Android.Widget;

namespace HanoiAir
{
    public class GaugeView : View
    {
        private static Android.Graphics.Color GaugeBackgroundColour = Android.Graphics.Color.Black;

        public GaugeView(Context context)
            : base(context)
        {
            Initialize();
        }

        public GaugeView(Context context, IAttributeSet attrs)
            : base(context, attrs)
        {
            Initialize();
        }

        public GaugeView(Context context, IAttributeSet attrs, int defStyle)
            : base(context, attrs, defStyle)
        {
            Initialize();
        }

        void Initialize()
        {
            value = 0;   
            points = new float[]
            {
                    0,
                    50,
                    100,
                    150,
                    160,
                    170,
                    180,
                    190,
                    200,
                    250,
                    300,
                    400,
                    500
            };
        }

        private float value;
        public float Value{ get{return value; }set{this.value = value;PostInvalidate(); } }

        protected override void OnDraw(Android.Graphics.Canvas canvas)
        {
            base.OnDraw(canvas);
            canvas.DrawColor(Android.Graphics.Color.Argb(190,255,255,255));
            DrawGauge(canvas);
            DrawLine(canvas);

        }

        private float[] points;
        private float startDegrees = 135;
        private float endDegrees = 45;

        private float ValueToDegrees(float inputValue)
        {
            var totalDegrees = endDegrees < startDegrees ? 360 - startDegrees + endDegrees : endDegrees - startDegrees;
            var degreesPerSegment = totalDegrees / (points.Length - 1);
            if (inputValue < points[0])
            {
                return startDegrees;
            }
            for (int i = 0; i < points.Length; i++)
            {
                if (inputValue < points[i+1])
                {
                    return (startDegrees + degreesPerSegment * (i +(inputValue-points[i]) / (points[i+1] - points[i]))) % 360;
                }
            }
            return endDegrees;
        }

        private Android.Graphics.RectF GetBoundingCircle()
        {
            
            float marginProportion = 0.05f;
            float gaugeWidth = this.Width * (1-marginProportion*2);
            float availableHeight = this.Height * (1- marginProportion * 2);
            float availableBoundingCircleHeight = 2 * availableHeight /(1+ (float)Math.Sin(endDegrees * 2 * (float)Math.PI / 360));
            //var gaugeHeight = this.Height * (1 - marginProportion * 2);
            float boundingCircleHeight = Math.Min(gaugeWidth, availableBoundingCircleHeight);
            gaugeWidth = boundingCircleHeight;
            var gaugeHeight = boundingCircleHeight / 2 * (1 + (float)Math.Sin(endDegrees * 2 * (float)Math.PI / 360));


            var gaugeLeft = (this.Width - gaugeWidth) / 2;
            var gaugeRight = this.Width - gaugeLeft;
            var gaugeTop = (this.Height - gaugeHeight) / 2;

            var gaugeBottom = gaugeTop + boundingCircleHeight;

            var gaugeOutlineOval = new Android.Graphics.RectF(gaugeLeft, gaugeTop, gaugeRight, gaugeBottom);

            return gaugeOutlineOval;
        }

        private void DrawGauge(Android.Graphics.Canvas canvas)
        {
            var totalDegrees = endDegrees < startDegrees ? 360 - startDegrees + endDegrees : endDegrees - startDegrees;

            var gaugeOutlineOval = GetBoundingCircle();

            var centreX = gaugeOutlineOval.Left + gaugeOutlineOval.Width() / 2;
            var centreY = gaugeOutlineOval.Top + gaugeOutlineOval.Height() / 2;
            DrawSegment(canvas, gaugeOutlineOval, startDegrees, totalDegrees, GaugeBackgroundColour);
            var gaugeOval = new Android.Graphics.RectF(gaugeOutlineOval.Left+2, gaugeOutlineOval.Top+2, gaugeOutlineOval.Right-2, gaugeOutlineOval.Bottom-2);

            int segments = 12;
            float segmentDegrees = (float)totalDegrees / segments;

            DrawSegment(canvas, gaugeOval, startDegrees, segmentDegrees, Android.Graphics.Color.DarkGreen);
            DrawSegment(canvas, gaugeOval, startDegrees + segmentDegrees, segmentDegrees, Android.Graphics.Color.Gold);
            DrawSegment(canvas, gaugeOval, startDegrees + segmentDegrees * 2, segmentDegrees, Android.Graphics.Color.Orange);
            DrawSegment(canvas, gaugeOval, startDegrees + segmentDegrees * 3, segmentDegrees * 5, Android.Graphics.Color.Red);
            DrawSegment(canvas, gaugeOval, startDegrees + segmentDegrees * 8, segmentDegrees * 4, Android.Graphics.Color.Purple);
            var halfOval = new Android.Graphics.RectF(gaugeOval.Left + gaugeOval.Width() / 8, gaugeOval.Top + gaugeOval.Height() / 8,
                               gaugeOval.Right - gaugeOval.Width() / 8, gaugeOval.Bottom - gaugeOval.Height() / 8);
            DrawSegment(canvas, halfOval, 90,190, Android.Graphics.Color.White);
            DrawSegment(canvas, halfOval, 270,190, Android.Graphics.Color.White);

            var centrePaint = new Android.Graphics.Paint(){ Color = Android.Graphics.Color.Black };
            centrePaint.SetStyle(Android.Graphics.Paint.Style.FillAndStroke);
            canvas.DrawCircle(centreX, centreY, gaugeOval.Width() / 32, centrePaint);
        }

        private void DrawSegment(Android.Graphics.Canvas canvas, Android.Graphics.RectF boundingBox, float startDegrees, float sweepDegrees, Android.Graphics.Color color)
        {
            Console.Out.WriteLine("Drawing segment at " + startDegrees + " for " + sweepDegrees );
            var path = new Android.Graphics.Path();
            path.ArcTo(boundingBox, startDegrees, sweepDegrees);
            path.LineTo((boundingBox.Width())/2 + boundingBox.Left, (boundingBox.Height())/2 + boundingBox.Top);
            path.Close();
            path.SetFillType(Android.Graphics.Path.FillType.EvenOdd);
            var paint = new Android.Graphics.Paint(){ Color = color };
            paint.SetStyle(Android.Graphics.Paint.Style.FillAndStroke);
            paint.AntiAlias = true;

       
            canvas.DrawPath(path, paint);
        }


        private void DrawLine(Android.Graphics.Canvas canvas)
        {
            var degrees = ValueToDegrees(value);
            var outlineOval = GetBoundingCircle();

            Console.Out.WriteLine("Drawing line at " + degrees);

            DrawSegment(canvas, outlineOval, degrees - 2f, 4, Android.Graphics.Color.Black);
            DrawSegment(canvas, outlineOval, degrees - 1f, 2, Android.Graphics.Color.Azure);
        }


        protected override void OnMeasure(int widthMeasureSpec, int heightMeasureSpec)
        {
          //  this.MeasuredWidth = widthMeasureSpec;
        //    this.MeasuredHeight = heightMeasureSpec;

            var height = GetDefaultSize(SuggestedMinimumHeight, heightMeasureSpec);
            var width = GetDefaultSize(SuggestedMinimumWidth, widthMeasureSpec);

            if (height < width / 2)
            {
                height = width / 2;
            }
            SetMeasuredDimension(width,height);
        }
    }
}

