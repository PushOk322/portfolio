/**
 * Fixture data for the portfolio build.
 *
 * The course groupings, descriptions and paywall flags are invented — there is no real
 * platform behind this. The videos are real: every YouTube id below was verified
 * through YouTube's oEmbed endpoint, so the titles and channel names are the creators'
 * own. Durations are read out of the titles where the creator stated one, and default
 * to 20:00 where they did not.
 *
 * Thumbnails are fetched once at prep time and served from this origin. Hotlinking
 * i.ytimg.com was tried first and does not hold up: 27 concurrent thumbnail requests
 * from one page and YouTube drops about a third of them, permanently — an <img> that
 * errors never retries. Measured 32 of 48 loading and never recovering.
 *
 * The player still talks to YouTube, and only when a visitor opens a session.
 *
 * Shapes match what the components read — course.videos, course.preview_fullscreen,
 * video.is_paid, video.duration, banners.episodes_count.
 */

import t_R0mMyV5OtcM from '../assets/thumbs/R0mMyV5OtcM.webp'
import t_mmq5zZfmIws from '../assets/thumbs/mmq5zZfmIws.webp'
import t_cbKkB3POqaY from '../assets/thumbs/cbKkB3POqaY.webp'
import t_ml6cT4AZdqI from '../assets/thumbs/ml6cT4AZdqI.webp'
import t_gC_L9qAHVJ8 from '../assets/thumbs/gC_L9qAHVJ8.webp'
import t_UBMk30rjy0o from '../assets/thumbs/UBMk30rjy0o.webp'
import t_Ev6yE55kYGw from '../assets/thumbs/Ev6yE55kYGw.webp'
import t_1f8yoFFdkcY from '../assets/thumbs/1f8yoFFdkcY.webp'
import t_2pLT_olgUJs from '../assets/thumbs/2pLT-olgUJs.webp'
import t_4pKly2JojMw from '../assets/thumbs/4pKly2JojMw.webp'
import t_L_xrDAtykMI from '../assets/thumbs/L_xrDAtykMI.webp'
import t_g_tea8ZNk5A from '../assets/thumbs/g_tea8ZNk5A.webp'
import t_qULTwquOuT4 from '../assets/thumbs/qULTwquOuT4.webp'
import t_sTANio_2E0Q from '../assets/thumbs/sTANio_2E0Q.webp'
import t_v7AYKMP6rOE from '../assets/thumbs/v7AYKMP6rOE.webp'
import t_Eml2xnoLpYE from '../assets/thumbs/Eml2xnoLpYE.webp'
import t_X655B4ISakg from '../assets/thumbs/X655B4ISakg.webp'
import t_enYITYwvPAQ from '../assets/thumbs/enYITYwvPAQ.webp'
import t_oc4QS2USKmk from '../assets/thumbs/oc4QS2USKmk.webp'

const THUMB = {
	'R0mMyV5OtcM': t_R0mMyV5OtcM,
	'mmq5zZfmIws': t_mmq5zZfmIws,
	'cbKkB3POqaY': t_cbKkB3POqaY,
	'ml6cT4AZdqI': t_ml6cT4AZdqI,
	'gC_L9qAHVJ8': t_gC_L9qAHVJ8,
	'UBMk30rjy0o': t_UBMk30rjy0o,
	'Ev6yE55kYGw': t_Ev6yE55kYGw,
	'1f8yoFFdkcY': t_1f8yoFFdkcY,
	'2pLT-olgUJs': t_2pLT_olgUJs,
	'4pKly2JojMw': t_4pKly2JojMw,
	'L_xrDAtykMI': t_L_xrDAtykMI,
	'g_tea8ZNk5A': t_g_tea8ZNk5A,
	'qULTwquOuT4': t_qULTwquOuT4,
	'sTANio_2E0Q': t_sTANio_2E0Q,
	'v7AYKMP6rOE': t_v7AYKMP6rOE,
	'Eml2xnoLpYE': t_Eml2xnoLpYE,
	'X655B4ISakg': t_X655B4ISakg,
	'enYITYwvPAQ': t_enYITYwvPAQ,
	'oc4QS2USKmk': t_oc4QS2USKmk
}

export const courses = [
	{
		"id": 1,
		"name": "HIIT & Conditioning",
		"description": "Interval sessions from 7 to 30 minutes. No equipment, no repeats.",
		"preview": THUMB['R0mMyV5OtcM'],
		"preview_fullscreen": THUMB['R0mMyV5OtcM'],
		"type": "course",
		"is_paid": false,
		"videos": [
			{
				"id": 101,
				"number": 1,
				"name": "Easy Warm Up Cardio Workout",
				"author": "FitnessBlender",
				"duration": "20:00",
				"preview": THUMB['R0mMyV5OtcM'],
				"video": "https://www.youtube.com/watch?v=R0mMyV5OtcM",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 102,
				"number": 2,
				"name": "7 Minute Workout Song (with timer)",
				"author": "Tabata Songs",
				"duration": "7:00",
				"preview": THUMB['mmq5zZfmIws'],
				"video": "https://www.youtube.com/watch?v=mmq5zZfmIws",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 103,
				"number": 3,
				"name": "25 MIN Full Body HIIT for Beginners",
				"author": "growingannanas",
				"duration": "25:00",
				"preview": THUMB['cbKkB3POqaY'],
				"video": "https://www.youtube.com/watch?v=cbKkB3POqaY",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 104,
				"number": 4,
				"name": "30-Minute HIIT Cardio Workout with Warm Up",
				"author": "SELF",
				"duration": "30:00",
				"preview": THUMB['ml6cT4AZdqI'],
				"video": "https://www.youtube.com/watch?v=ml6cT4AZdqI",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 105,
				"number": 5,
				"name": "30 Minute Fat Burning Home Workout for Beginners",
				"author": "Body Project",
				"duration": "30:00",
				"preview": THUMB['gC_L9qAHVJ8'],
				"video": "https://www.youtube.com/watch?v=gC_L9qAHVJ8",
				"type": "video",
				"is_paid": false
			}
		]
	},
	{
		"id": 2,
		"name": "Full Body, No Equipment",
		"description": "One mat, nothing else. Progressive sessions for the whole body.",
		"preview": THUMB['UBMk30rjy0o'],
		"preview_fullscreen": THUMB['UBMk30rjy0o'],
		"type": "course",
		"is_paid": false,
		"videos": [
			{
				"id": 201,
				"number": 1,
				"name": "20 MIN Full Body Workout",
				"author": "Pamela Reif",
				"duration": "20:00",
				"preview": THUMB['UBMk30rjy0o'],
				"video": "https://www.youtube.com/watch?v=UBMk30rjy0o",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 202,
				"number": 2,
				"name": "25 MIN Full Body HIIT for Beginners",
				"author": "growingannanas",
				"duration": "25:00",
				"preview": THUMB['cbKkB3POqaY'],
				"video": "https://www.youtube.com/watch?v=cbKkB3POqaY",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 203,
				"number": 3,
				"name": "15-Minute Workout for Older Adults",
				"author": "National Institute on Aging",
				"duration": "15:00",
				"preview": THUMB['Ev6yE55kYGw'],
				"video": "https://www.youtube.com/watch?v=Ev6yE55kYGw",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 204,
				"number": 4,
				"name": "30 Minute Fat Burning Home Workout for Beginners",
				"author": "Body Project",
				"duration": "30:00",
				"preview": THUMB['gC_L9qAHVJ8'],
				"video": "https://www.youtube.com/watch?v=gC_L9qAHVJ8",
				"type": "video",
				"is_paid": false
			}
		]
	},
	{
		"id": 3,
		"name": "Core & Abs",
		"description": "Short, focused core work. Anti-rotation and bracing, not endless crunches.",
		"preview": THUMB['1f8yoFFdkcY'],
		"preview_fullscreen": THUMB['1f8yoFFdkcY'],
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 301,
				"number": 1,
				"name": "10 MIN Beginner Ab Workout",
				"author": "Pamela Reif",
				"duration": "10:00",
				"preview": THUMB['1f8yoFFdkcY'],
				"video": "https://www.youtube.com/watch?v=1f8yoFFdkcY",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 302,
				"number": 2,
				"name": "Abs Workout Challenge",
				"author": "Chloe Ting",
				"duration": "20:00",
				"preview": THUMB['2pLT-olgUJs'],
				"video": "https://www.youtube.com/watch?v=2pLT-olgUJs",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 303,
				"number": 3,
				"name": "20 MIN Full Body Workout",
				"author": "Pamela Reif",
				"duration": "20:00",
				"preview": THUMB['UBMk30rjy0o'],
				"video": "https://www.youtube.com/watch?v=UBMk30rjy0o",
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 4,
		"name": "Mobility & Recovery",
		"description": "Stretch and mobility routines for hips, shoulders and thoracic spine.",
		"preview": THUMB['4pKly2JojMw'],
		"preview_fullscreen": THUMB['4pKly2JojMw'],
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 401,
				"number": 1,
				"name": "10 Min Morning Yoga Full Body Stretch",
				"author": "Yoga with Kassandra",
				"duration": "10:00",
				"preview": THUMB['4pKly2JojMw'],
				"video": "https://www.youtube.com/watch?v=4pKly2JojMw",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 402,
				"number": 2,
				"name": "15 Minute Beginner Stretch Flexibility Routine",
				"author": "Tom Merrick",
				"duration": "15:00",
				"preview": THUMB['L_xrDAtykMI'],
				"video": "https://www.youtube.com/watch?v=L_xrDAtykMI",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 403,
				"number": 3,
				"name": "15 Min Full Body Stretch",
				"author": "Mady Morrison",
				"duration": "15:00",
				"preview": THUMB['g_tea8ZNk5A'],
				"video": "https://www.youtube.com/watch?v=g_tea8ZNk5A",
				"type": "video",
				"is_paid": true
			},
			{
				"id": 404,
				"number": 4,
				"name": "Beginner Flexibility Routine",
				"author": "MadFit",
				"duration": "20:00",
				"preview": THUMB['qULTwquOuT4'],
				"video": "https://www.youtube.com/watch?v=qULTwquOuT4",
				"type": "video",
				"is_paid": true
			},
			{
				"id": 405,
				"number": 5,
				"name": "20 Min Full Body Stretch for Stress Relief",
				"author": "MadFit",
				"duration": "20:00",
				"preview": THUMB['sTANio_2E0Q'],
				"video": "https://www.youtube.com/watch?v=sTANio_2E0Q",
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 5,
		"name": "Yoga",
		"description": "Beginner-friendly flows for strength, flexibility and a calmer head.",
		"preview": THUMB['v7AYKMP6rOE'],
		"preview_fullscreen": THUMB['v7AYKMP6rOE'],
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 501,
				"number": 1,
				"name": "Yoga For Complete Beginners - 20 Minute Home Yoga",
				"author": "Yoga With Adriene",
				"duration": "20:00",
				"preview": THUMB['v7AYKMP6rOE'],
				"video": "https://www.youtube.com/watch?v=v7AYKMP6rOE",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 502,
				"number": 2,
				"name": "Full Body Yoga for Strength & Flexibility",
				"author": "growingannanas",
				"duration": "20:00",
				"preview": THUMB['Eml2xnoLpYE'],
				"video": "https://www.youtube.com/watch?v=Eml2xnoLpYE",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 503,
				"number": 3,
				"name": "10 Min Morning Yoga Full Body Stretch",
				"author": "Yoga with Kassandra",
				"duration": "10:00",
				"preview": THUMB['4pKly2JojMw'],
				"video": "https://www.youtube.com/watch?v=4pKly2JojMw",
				"type": "video",
				"is_paid": true
			},
			{
				"id": 504,
				"number": 4,
				"name": "Yoga for Kids",
				"author": "TELUS STORYHIVE",
				"duration": "20:00",
				"preview": THUMB['X655B4ISakg'],
				"video": "https://www.youtube.com/watch?v=X655B4ISakg",
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 6,
		"name": "Low Impact & Walking",
		"description": "Joint-friendly cardio you can do in a small room and quiet shoes.",
		"preview": THUMB['enYITYwvPAQ'],
		"preview_fullscreen": THUMB['enYITYwvPAQ'],
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 601,
				"number": 1,
				"name": "Fast Walking in 30 Minutes",
				"author": "Walk at Home",
				"duration": "30:00",
				"preview": THUMB['enYITYwvPAQ'],
				"video": "https://www.youtube.com/watch?v=enYITYwvPAQ",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 602,
				"number": 2,
				"name": "15-Minute Workout for Older Adults",
				"author": "National Institute on Aging",
				"duration": "15:00",
				"preview": THUMB['Ev6yE55kYGw'],
				"video": "https://www.youtube.com/watch?v=Ev6yE55kYGw",
				"type": "video",
				"is_paid": false
			},
			{
				"id": 603,
				"number": 3,
				"name": "9 Min Exercise for Kids",
				"author": "Little Sports",
				"duration": "9:00",
				"preview": THUMB['oc4QS2USKmk'],
				"video": "https://www.youtube.com/watch?v=oc4QS2USKmk",
				"type": "video",
				"is_paid": true
			},
			{
				"id": 604,
				"number": 4,
				"name": "Easy Warm Up Cardio Workout",
				"author": "FitnessBlender",
				"duration": "20:00",
				"preview": THUMB['R0mMyV5OtcM'],
				"video": "https://www.youtube.com/watch?v=R0mMyV5OtcM",
				"type": "video",
				"is_paid": true
			}
		]
	}
]

export const banners = [
	{
		"id": 1,
		"title": "HIIT & Conditioning",
		"description": "Interval sessions from 7 to 30 minutes. No equipment, no repeats.",
		"episodes_count": 5,
		"preview": THUMB['R0mMyV5OtcM'],
		"preview_fullscreen": THUMB['R0mMyV5OtcM'],
		"course_id": 1
	},
	{
		"id": 2,
		"title": "Full Body, No Equipment",
		"description": "One mat, nothing else. Progressive sessions for the whole body.",
		"episodes_count": 4,
		"preview": THUMB['UBMk30rjy0o'],
		"preview_fullscreen": THUMB['UBMk30rjy0o'],
		"course_id": 2
	},
	{
		"id": 3,
		"title": "Core & Abs",
		"description": "Short, focused core work. Anti-rotation and bracing, not endless crunches.",
		"episodes_count": 3,
		"preview": THUMB['1f8yoFFdkcY'],
		"preview_fullscreen": THUMB['1f8yoFFdkcY'],
		"course_id": 3
	},
	{
		"id": 4,
		"title": "Mobility & Recovery",
		"description": "Stretch and mobility routines for hips, shoulders and thoracic spine.",
		"episodes_count": 5,
		"preview": THUMB['4pKly2JojMw'],
		"preview_fullscreen": THUMB['4pKly2JojMw'],
		"course_id": 4
	}
]

export const offert = {
	"title": "Terms of use",
	"text": "Placeholder terms for the portfolio build. The production app fetched the real document from the platform API; nothing here is a legal notice."
}

export const user = {
	"id": 1,
	"name": "Demo viewer",
	"email": "demo@example.com",
	"is_subscribed": true,
	"token": "demo-session"
}
