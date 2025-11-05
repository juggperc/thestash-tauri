/*
 * BeatDetektor.js
 *
 * BeatDetektor - CubicFX Visualizer Beat Detection & Analysis Algorithm
 * Javascript port by Charles J. Cliffe and Corban Brook
 *  
 * Copyright (c) 2009 Charles J. Cliffe.
 *
 * BeatDetektor is distributed under the terms of the MIT License.
 * http://opensource.org/licenses/MIT
 */

BeatDetektor = function(bpm_minimum, bpm_maximum, alt_config)
{
	if (typeof(bpm_minimum)=='undefined') bpm_minimum = 85.0;
	if (typeof(bpm_maximum)=='undefined') bpm_maximum = 169.0
	
	this.config = (typeof(alt_config)!='undefined')?alt_config:BeatDetektor.config;
	
	this.BPM_MIN = bpm_minimum;
	this.BPM_MAX = bpm_maximum;

	this.beat_counter = 0;
	this.half_counter = 0;
	this.quarter_counter = 0;

	this.a_freq_range = new Array(this.config.BD_DETECTION_RANGES);
	this.ma_freq_range = new Array(this.config.BD_DETECTION_RANGES);
	this.maa_freq_range = new Array(this.config.BD_DETECTION_RANGES);
	this.last_detection = new Array(this.config.BD_DETECTION_RANGES);

	this.ma_bpm_range = new Array(this.config.BD_DETECTION_RANGES);
	this.maa_bpm_range = new Array(this.config.BD_DETECTION_RANGES);

	this.detection_quality = new Array(this.config.BD_DETECTION_RANGES);

	this.detection = new Array(this.config.BD_DETECTION_RANGES); 
	
	this.reset();
	
	if (typeof(console)!='undefined')
	{
		console.log("BeatDetektor("+this.BPM_MIN+","+this.BPM_MAX+") created.")
	}
}

BeatDetektor.prototype.reset = function()
{
	for (var i = 0; i < this.config.BD_DETECTION_RANGES; i++)
	{
		this.a_freq_range[i] = 0.0;
		this.ma_freq_range[i] = 0.0;
		this.maa_freq_range[i] = 0.0;
		this.last_detection[i] = 0.0;
		
		this.ma_bpm_range[i] = 
		this.maa_bpm_range[i] = 60.0/this.BPM_MIN + ((60.0/this.BPM_MAX-60.0/this.BPM_MIN) * (i/this.config.BD_DETECTION_RANGES));		
		
		this.detection_quality[i] = 0.0;
		this.detection[i] = false;
	}
	
	this.ma_quality_avg = 0;
	this.ma_quality_total = 0;
	
	this.bpm_contest = new Array();
	this.bpm_contest_lo = new Array();
	
	this.quality_total = 0.0;
	this.quality_avg = 0.0;

	this.current_bpm = 0.0; 
	this.current_bpm_lo = 0.0; 

	this.winning_bpm = 0.0; 
	this.win_val = 0.0;
	this.winning_bpm_lo = 0.0; 
	this.win_val_lo = 0.0;

	this.win_bpm_int = 0;
	this.win_bpm_int_lo = 0;

	this.bpm_predict = 0;

	this.is_erratic = false;
	this.bpm_offset = 0.0;
	this.last_timer = 0.0;
	this.last_update = 0.0;

	this.bpm_timer = 0.0;
	this.beat_counter = 0;
	this.half_counter = 0;
	this.quarter_counter = 0;
}


BeatDetektor.config_default = {
	BD_DETECTION_RANGES : 128,
	BD_DETECTION_RATE : 12.0,
	BD_DETECTION_FACTOR : 0.915,
	BD_QUALITY_DECAY : 0.6,
	BD_QUALITY_TOLERANCE : 0.96,
	BD_QUALITY_REWARD : 10.0,
	BD_QUALITY_STEP : 0.1,
	BD_MINIMUM_CONTRIBUTIONS : 6,
	BD_FINISH_LINE : 60.0,
	BD_REWARD_TOLERANCES : [ 0.001, 0.005, 0.01, 0.02, 0.04, 0.08, 0.10, 0.15, 0.30 ],
	BD_REWARD_MULTIPLIERS : [ 20.0, 10.0, 8.0, 1.0, 1.0/2.0, 1.0/4.0, 1.0/8.0, 1/16.0, 1/32.0 ]
};

BeatDetektor.config = BeatDetektor.config_default;

BeatDetektor.prototype.process = function(timer_seconds, fft_data)
{
	if (!this.last_timer) { this.last_timer = timer_seconds; return; }
	if (this.last_timer > timer_seconds) { this.reset(); return; }
	
	var timestamp = timer_seconds;
	
	this.last_update = timer_seconds - this.last_timer;
	this.last_timer = timer_seconds;

	if (this.last_update > 1.0) { this.reset(); return; }

	var i,x;
	var v;
	
	var bpm_floor = 60.0/this.BPM_MAX;
	var bpm_ceil = 60.0/this.BPM_MIN;
	
	var range_step = (fft_data.length / this.config.BD_DETECTION_RANGES);
	var range = 0;
	
		
	for (x=0; x<fft_data.length; x+=range_step)
	{
		this.a_freq_range[range] = 0;
		
		for (i = x; i<x+range_step; i++)
		{
			v = Math.abs(fft_data[i]);
			this.a_freq_range[range] += v;
		}
		
		this.a_freq_range[range] /= range_step;
		
		this.ma_freq_range[range] -= (this.ma_freq_range[range]-this.a_freq_range[range])*this.last_update*this.config.BD_DETECTION_RATE;
		this.maa_freq_range[range] -= (this.maa_freq_range[range]-this.ma_freq_range[range])*this.last_update*this.config.BD_DETECTION_RATE;
		
		var det = (this.ma_freq_range[range]*this.config.BD_DETECTION_FACTOR >= this.maa_freq_range[range]);
		
		if (this.ma_bpm_range[range] > bpm_ceil) this.ma_bpm_range[range] = bpm_ceil;
		if (this.ma_bpm_range[range] < bpm_floor) this.ma_bpm_range[range] = bpm_floor;
		if (this.maa_bpm_range[range] > bpm_ceil) this.maa_bpm_range[range] = bpm_ceil;
		if (this.maa_bpm_range[range] < bpm_floor) this.maa_bpm_range[range] = bpm_floor;
			
		var rewarded = false;
		
		if (!this.detection[range] && det)
		{
			var trigger_gap = timestamp-this.last_detection[range];
			
			if (trigger_gap < bpm_ceil && trigger_gap > (bpm_floor))
			{		
				for (i = 0; i < this.config.BD_REWARD_TOLERANCES.length; i++)
				{
					if (Math.abs(this.ma_bpm_range[range]-trigger_gap) < this.ma_bpm_range[range]*this.config.BD_REWARD_TOLERANCES[i])
					{
						this.detection_quality[range] += this.config.BD_QUALITY_REWARD * this.config.BD_REWARD_MULTIPLIERS[i]; 
						rewarded = true;
					}
				}				
				
				if (rewarded) 
				{
					this.last_detection[range] = timestamp;
				}
			}
			else if (trigger_gap >= bpm_ceil)
			{
				trigger_gap /= 2.0;

				if (trigger_gap < bpm_ceil && trigger_gap > (bpm_floor)) for (i = 0; i < this.config.BD_REWARD_TOLERANCES.length; i++)
				{
					if (Math.abs(this.ma_bpm_range[range]-trigger_gap) < this.ma_bpm_range[range]*this.config.BD_REWARD_TOLERANCES[i])
					{
						this.detection_quality[range] += this.config.BD_QUALITY_REWARD * this.config.BD_REWARD_MULTIPLIERS[i]; 
						rewarded = true;
					}
				}
				
				if (!rewarded) 
				{
					trigger_gap *= 2.0;
				}
				this.last_detection[range] = timestamp;	
			}
			
			if (rewarded)
			{
				var qmp = (this.detection_quality[range]/this.quality_avg)*this.config.BD_QUALITY_STEP;
				if (qmp > 1.0)
				{
					qmp = 1.0;
				}

				this.ma_bpm_range[range] -= (this.ma_bpm_range[range]-trigger_gap) * qmp;				
				this.maa_bpm_range[range] -= (this.maa_bpm_range[range]-this.ma_bpm_range[range]) * qmp;
			}
			else if (trigger_gap >= bpm_floor && trigger_gap <= bpm_ceil)
			{
				if (this.detection_quality[range] < this.quality_avg*this.config.BD_QUALITY_TOLERANCE && this.current_bpm)
				{
					this.ma_bpm_range[range] -= (this.ma_bpm_range[range]-trigger_gap) * this.config.BD_QUALITY_STEP;
					this.maa_bpm_range[range] -= (this.maa_bpm_range[range]-this.ma_bpm_range[range]) * this.config.BD_QUALITY_STEP;
				}
				this.detection_quality[range] -= this.config.BD_QUALITY_STEP;
			}
			else if (trigger_gap >= bpm_ceil)
			{
				if ((this.detection_quality[range] < this.quality_avg*this.config.BD_QUALITY_TOLERANCE) && this.current_bpm)
				{
					this.ma_bpm_range[range] -= (this.ma_bpm_range[range]-this.current_bpm) * 0.5;
					this.maa_bpm_range[range] -= (this.maa_bpm_range[range]-this.ma_bpm_range[range]) * 0.5 ;
				}
				this.detection_quality[range]-= this.config.BD_QUALITY_STEP;
			}
			
		}
				
		if ((!rewarded && timestamp-this.last_detection[range] > bpm_ceil) || (det && Math.abs(this.ma_bpm_range[range]-this.current_bpm) > this.bpm_offset)) 
			this.detection_quality[range] -= this.detection_quality[range]*this.config.BD_QUALITY_STEP*this.config.BD_QUALITY_DECAY*this.last_update;
		
		if (this.detection_quality[range] < 0.001) this.detection_quality[range]=0.001;
				
		this.detection[range] = det;		
		
		range++;
	}
		
	this.quality_total = 0;
	
	var bpm_total = 0;
	var bpm_contributions = 0;
	
	for (var x=0; x<this.config.BD_DETECTION_RANGES; x++)
	{
		this.quality_total += this.detection_quality[x];
	}
	
	this.quality_avg = this.quality_total / this.config.BD_DETECTION_RANGES;
	
	if (this.quality_total)
	{
		this.ma_quality_avg += (this.quality_avg - this.ma_quality_avg) * this.last_update * this.config.BD_DETECTION_RATE/2.0;
		this.maa_quality_avg += (this.ma_quality_avg - this.maa_quality_avg) * this.last_update;
		this.ma_quality_total += (this.quality_total - this.ma_quality_total) * this.last_update * this.config.BD_DETECTION_RATE/2.0;
		this.ma_quality_avg -= 0.98*this.ma_quality_avg*this.last_update*3.0;
	}
	else
	{
		this.quality_avg = 0.001;
	}

	if (this.ma_quality_total <= 0) this.ma_quality_total = 0.001;
	if (this.ma_quality_avg <= 0) this.ma_quality_avg = 0.001;
	
	var avg_bpm_offset = 0.0;
	var offset_test_bpm = this.current_bpm;
	var draft = new Array();
	
	if (this.quality_avg) for (x=0; x<this.config.BD_DETECTION_RANGES; x++)
	{
		if (this.detection_quality[x]*this.config.BD_QUALITY_TOLERANCE >= this.ma_quality_avg)
		{
			if (this.ma_bpm_range[x] < bpm_ceil && this.ma_bpm_range[x] > bpm_floor)
			{
				bpm_total += this.maa_bpm_range[x];

				var draft_float = Math.round((60.0/this.maa_bpm_range[x])*1000.0);
				
				draft_float = (Math.abs(Math.ceil(draft_float)-(60.0/this.current_bpm)*1000.0)<(Math.abs(Math.floor(draft_float)-(60.0/this.current_bpm)*1000.0)))?Math.ceil(draft_float/10.0):Math.floor(draft_float/10.0);
				var draft_int = parseInt(draft_float/10.0);
				if (typeof(draft[draft_int]=='undefined')) draft[draft_int] = 0;
				
				draft[draft_int]+=this.detection_quality[x]/this.quality_avg;
				bpm_contributions++;
				if (offset_test_bpm == 0.0) offset_test_bpm = this.maa_bpm_range[x];
				else 
				{
					avg_bpm_offset += Math.abs(offset_test_bpm-this.maa_bpm_range[x]);
				}
			}
		}
	}
		
	var has_prediction = (bpm_contributions>=this.config.BD_MINIMUM_CONTRIBUTIONS)?true:false;

	var draft_winner=0;
	var win_val = 0;
	
	if (has_prediction) 
	{
		for (var draft_i in draft)
		{
			if (draft[draft_i] > win_val)
			{
				win_val = draft[draft_i];
				draft_winner = draft_i;
			}
		}
		
		this.bpm_predict = 60.0/(draft_winner/10.0);
		
		avg_bpm_offset /= bpm_contributions;
		this.bpm_offset = avg_bpm_offset;
		
		if (!this.current_bpm)  
		{
			this.current_bpm = this.bpm_predict; 
		}
	}
		
	if (this.current_bpm && this.bpm_predict) this.current_bpm -= (this.current_bpm-this.bpm_predict)*this.last_update;	
	
	var contest_max=0;
	
	for (var contest_i in this.bpm_contest)
	{
		if (contest_max < this.bpm_contest[contest_i]) contest_max = this.bpm_contest[contest_i]; 
		if (this.bpm_contest[contest_i] > this.config.BD_FINISH_LINE/2.0)
		{
			var draft_int_lo = parseInt(Math.round((contest_i)/10.0));
			if (this.bpm_contest_lo[draft_int_lo] != this.bpm_contest_lo[draft_int_lo]) this.bpm_contest_lo[draft_int_lo] = 0;
			this.bpm_contest_lo[draft_int_lo]+= (this.bpm_contest[contest_i]/6.0)*this.last_update;
		}
	}
		
	if (contest_max > this.config.BD_FINISH_LINE) 
	{
		for (var contest_i in this.bpm_contest)
		{
			this.bpm_contest[contest_i]=(this.bpm_contest[contest_i]/contest_max)*this.config.BD_FINISH_LINE;
		}
	}

	contest_max = 0;
	for (var contest_i in this.bpm_contest_lo)
	{
		if (contest_max < this.bpm_contest_lo[contest_i]) contest_max = this.bpm_contest_lo[contest_i]; 
	}

	if (contest_max > this.config.BD_FINISH_LINE) 
	{
		for (var contest_i in this.bpm_contest_lo)
		{
			this.bpm_contest_lo[contest_i]=(this.bpm_contest_lo[contest_i]/contest_max)*this.config.BD_FINISH_LINE;
		}
	}

	for (contest_i in this.bpm_contest)
	{
		this.bpm_contest[contest_i]-=this.bpm_contest[contest_i]*(this.last_update/this.config.BD_DETECTION_RATE);
	}
	
	for (contest_i in this.bpm_contest_lo)
	{
		this.bpm_contest_lo[contest_i]-=this.bpm_contest_lo[contest_i]*(this.last_update/this.config.BD_DETECTION_RATE);
	}
	
	this.bpm_timer+=this.last_update;
	
	var winner = 0;
	var winner_lo = 0;
	
	if (this.bpm_timer > this.winning_bpm/4.0 && this.current_bpm)
	{		
		this.win_val = 0;
		this.win_val_lo = 0;

		if (this.winning_bpm) while (this.bpm_timer > this.winning_bpm/4.0) this.bpm_timer -= this.winning_bpm/4.0;
		
		this.quarter_counter++;		
		this.half_counter= parseInt(this.quarter_counter/2);
		this.beat_counter = parseInt(this.quarter_counter/4);
		
		var idx = parseInt(Math.round((60.0/this.current_bpm)*10.0));
		if (typeof(this.bpm_contest[idx])=='undefined') this.bpm_contest[idx] = 0;
		this.bpm_contest[idx]+=this.config.BD_QUALITY_REWARD;
		
		for (var contest_i in this.bpm_contest)
		{
			if (this.win_val < this.bpm_contest[contest_i])
			{
				winner = contest_i;
				this.win_val = this.bpm_contest[contest_i];
			}
		}
		
		if (winner)
		{
			this.win_bpm_int = parseInt(winner);
			this.winning_bpm = (60.0/(winner/10.0));
		}
		
		for (var contest_i in this.bpm_contest_lo)
		{
			if (this.win_val_lo < this.bpm_contest_lo[contest_i])
			{
				winner_lo = contest_i;
				this.win_val_lo = this.bpm_contest_lo[contest_i];
			}
		}
		
		if (winner_lo)
		{
			this.win_bpm_int_lo = parseInt(winner_lo);
			this.winning_bpm_lo = 60.0/winner_lo;
		}
	}

}

