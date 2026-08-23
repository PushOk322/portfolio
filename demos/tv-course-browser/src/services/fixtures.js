/**
 * Invented fixture data for the portfolio build.
 *
 * Shapes are the production ones — derived from what the components actually read
 * (`course.videos`, `course.preview_fullscreen`, `video.is_paid`, `video.duration`).
 * The content is made up: no real course titles, durations or customer data.
 */

import placeholder from '../assets/images/course-placeholder.jpg'

// Imported rather than written as a string path: webpack rewrites the URL and copies
// the file, so a hardcoded './assets/...' would 404 in the built output.

export const courses = [
	{
		"id": 1,
		"name": "Full Body Foundations",
		"description": "A ten-part introduction to compound movement. No equipment beyond a mat.",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"type": "course",
		"is_paid": false,
		"videos": [
			{
				"id": 101,
				"number": 1,
				"name": "Session 1",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 102,
				"number": 2,
				"name": "Session 2",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 103,
				"number": 3,
				"name": "Session 3",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 104,
				"number": 4,
				"name": "Session 4",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 105,
				"number": 5,
				"name": "Session 5",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 106,
				"number": 6,
				"name": "Session 6",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 107,
				"number": 7,
				"name": "Session 7",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 108,
				"number": 8,
				"name": "Session 8",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 109,
				"number": 9,
				"name": "Session 9",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 2,
		"name": "Mobility & Recovery",
		"description": "Short daily sessions for hips, shoulders and thoracic spine.",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"type": "course",
		"is_paid": false,
		"videos": [
			{
				"id": 201,
				"number": 1,
				"name": "Session 1",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 202,
				"number": 2,
				"name": "Session 2",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 203,
				"number": 3,
				"name": "Session 3",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 204,
				"number": 4,
				"name": "Session 4",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 205,
				"number": 5,
				"name": "Session 5",
				"duration": "18:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 206,
				"number": 6,
				"name": "Session 6",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 207,
				"number": 7,
				"name": "Session 7",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 208,
				"number": 8,
				"name": "Session 8",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 209,
				"number": 9,
				"name": "Session 9",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 210,
				"number": 10,
				"name": "Session 10",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 211,
				"number": 11,
				"name": "Session 11",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 3,
		"name": "Strength: Lower Body",
		"description": "Progressive loading for squat, hinge and lunge patterns.",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 301,
				"number": 1,
				"name": "Session 1",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 302,
				"number": 2,
				"name": "Session 2",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 303,
				"number": 3,
				"name": "Session 3",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 304,
				"number": 4,
				"name": "Session 4",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 305,
				"number": 5,
				"name": "Session 5",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 306,
				"number": 6,
				"name": "Session 6",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 307,
				"number": 7,
				"name": "Session 7",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 308,
				"number": 8,
				"name": "Session 8",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 309,
				"number": 9,
				"name": "Session 9",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 310,
				"number": 10,
				"name": "Session 10",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 4,
		"name": "Core Without Crunches",
		"description": "Anti-rotation and bracing work that does not wreck your neck.",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 401,
				"number": 1,
				"name": "Session 1",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 402,
				"number": 2,
				"name": "Session 2",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 403,
				"number": 3,
				"name": "Session 3",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 404,
				"number": 4,
				"name": "Session 4",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 405,
				"number": 5,
				"name": "Session 5",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 406,
				"number": 6,
				"name": "Session 6",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 5,
		"name": "Morning Yoga Flow",
		"description": "Twenty-minute flows to start the day, three difficulty tiers.",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 501,
				"number": 1,
				"name": "Session 1",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 502,
				"number": 2,
				"name": "Session 2",
				"duration": "18:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 503,
				"number": 3,
				"name": "Session 3",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 504,
				"number": 4,
				"name": "Session 4",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 505,
				"number": 5,
				"name": "Session 5",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 506,
				"number": 6,
				"name": "Session 6",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 507,
				"number": 7,
				"name": "Session 7",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 508,
				"number": 8,
				"name": "Session 8",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 509,
				"number": 9,
				"name": "Session 9",
				"duration": "18:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 510,
				"number": 10,
				"name": "Session 10",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 511,
				"number": 11,
				"name": "Session 11",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 512,
				"number": 12,
				"name": "Session 12",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 6,
		"name": "Interval Conditioning",
		"description": "Bike, row or run — the intervals are the same either way.",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 601,
				"number": 1,
				"name": "Session 1",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 602,
				"number": 2,
				"name": "Session 2",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 603,
				"number": 3,
				"name": "Session 3",
				"duration": "18:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 604,
				"number": 4,
				"name": "Session 4",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 605,
				"number": 5,
				"name": "Session 5",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 606,
				"number": 6,
				"name": "Session 6",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 7,
		"name": "Posture for Desk Workers",
		"description": "What to do about eight hours in a chair.",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 701,
				"number": 1,
				"name": "Session 1",
				"duration": "18:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 702,
				"number": 2,
				"name": "Session 2",
				"duration": "18:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 703,
				"number": 3,
				"name": "Session 3",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 704,
				"number": 4,
				"name": "Session 4",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 705,
				"number": 5,
				"name": "Session 5",
				"duration": "18:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 706,
				"number": 6,
				"name": "Session 6",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 707,
				"number": 7,
				"name": "Session 7",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 708,
				"number": 8,
				"name": "Session 8",
				"duration": "25:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 709,
				"number": 9,
				"name": "Session 9",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 710,
				"number": 10,
				"name": "Session 10",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 711,
				"number": 11,
				"name": "Session 11",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			}
		]
	},
	{
		"id": 8,
		"name": "Kettlebell Basics",
		"description": "Swing, clean, press, snatch — one movement per session.",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"type": "course",
		"is_paid": true,
		"videos": [
			{
				"id": 801,
				"number": 1,
				"name": "Session 1",
				"duration": "18:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 802,
				"number": 2,
				"name": "Session 2",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": false
			},
			{
				"id": 803,
				"number": 3,
				"name": "Session 3",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 804,
				"number": 4,
				"name": "Session 4",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 805,
				"number": 5,
				"name": "Session 5",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 806,
				"number": 6,
				"name": "Session 6",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 807,
				"number": 7,
				"name": "Session 7",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 808,
				"number": 8,
				"name": "Session 8",
				"duration": "15:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 809,
				"number": 9,
				"name": "Session 9",
				"duration": "12:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 810,
				"number": 10,
				"name": "Session 10",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 811,
				"number": 11,
				"name": "Session 11",
				"duration": "21:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			},
			{
				"id": 812,
				"number": 12,
				"name": "Session 12",
				"duration": "30:00",
				"preview": placeholder,
				"type": "video",
				"is_paid": true
			}
		]
	}
]

export const banners = [
	{
		"id": 1,
		"title": "Full Body Foundations",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"episodes_count": 8,
		"description": "Featured this week.",
		"course_id": 1
	},
	{
		"id": 2,
		"title": "Mobility & Recovery",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"episodes_count": 8,
		"description": "Featured this week.",
		"course_id": 2
	},
	{
		"id": 3,
		"title": "Strength: Lower Body",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"episodes_count": 8,
		"description": "Featured this week.",
		"course_id": 3
	},
	{
		"id": 4,
		"title": "Core Without Crunches",
		"preview": placeholder,
		"preview_fullscreen": placeholder,
		"episodes_count": 8,
		"description": "Featured this week.",
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

