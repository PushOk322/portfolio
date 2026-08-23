import { BoatApplication } from '@/three/models/boat-configurator'

/**
 * Local catalogue.
 *
 * In production this whole option tree arrived from the backend as a schema, and the
 * UI was generated from it. There is no backend here, so the same shape is declared
 * locally — the configurator itself never knew the difference, because it only ever
 * received resolved paths and colour values.
 *
 * Engine model files were renamed `outboard-01…11`: the originals carried two
 * manufacturers' trademarks in their filenames, which are not the client's to
 * redistribute. The geometry is unchanged.
 */

export interface IEngineOption {
	id: string
	label: string
	path: string
}

export interface IMaterialOption {
	id: string
	label: string
	/** Folder under public/textures — the configurator appends the map names itself. */
	texture: string
}

export interface IColourOption {
	id: string
	label: string
	value: string
}

interface IBoat {
	current: BoatApplication | null
	engines: string[]
	texture: { [key: string]: string }
	textureName: { [key: string]: string }
	parts: {
		board: string
		dashboard: string
		fillDeck: string
		seatSegment1: string
		seatSegment2: string
		sideSegment1: string
		sideSegment2: string
	}
}

export const engineOptions: IEngineOption[] = [
	{ id: 'none', label: 'No engine', path: '' },
	{ id: 'e01', label: '15 hp · tiller', path: './models/outboard-01.glb' },
	{ id: 'e02', label: '20–25 hp · tiller', path: './models/outboard-02.glb' },
	{ id: 'e03', label: '40 hp', path: './models/outboard-03.glb' },
	{ id: 'e04', label: '40 hp · tiller', path: './models/outboard-04.glb' },
	{ id: 'e05', label: '50–60 hp', path: './models/outboard-05.glb' },
	{ id: 'e06', label: '50–60 hp · tiller', path: './models/outboard-06.glb' },
	{ id: 'e07', label: '70 hp', path: './models/outboard-07.glb' },
	{ id: 'e08', label: '200–225 hp', path: './models/outboard-08.glb' },
	{ id: 'e09', label: '250 hp', path: './models/outboard-09.glb' },
	{ id: 'e10', label: '300 hp', path: './models/outboard-10.glb' },
	{ id: 'e11', label: '250–300 hp · V8', path: './models/outboard-11.glb' }
]

export const upholsteryOptions: IMaterialOption[] = [
	{ id: 'carpet', label: 'Carpet', texture: 'carpet' },
	{ id: 'leather', label: 'Leather', texture: 'leather' },
	{ id: 'vinyl', label: 'Vinyl', texture: 'vinyl' }
]

export const colourOptions: IColourOption[] = [
	{ id: 'graphite', label: 'Graphite', value: '#4e4e4e' },
	{ id: 'ink', label: 'Ink', value: '#1f2a37' },
	{ id: 'sand', label: 'Sand', value: '#c8b18b' },
	{ id: 'oxide', label: 'Oxide', value: '#8c3b2f' },
	{ id: 'sage', label: 'Sage', value: '#6e7f68' },
	{ id: 'bone', label: 'Bone', value: '#e6e1d7' }
]

export const boat: IBoat = {
	current: null,
	engines: engineOptions.filter((e) => e.path).map((e) => e.path),
	texture: {
		logo_light: './textures/logo_light.png',
		logo_dark: './textures/logo_dark.png',
		design: './textures/design.png'
	},
	textureName: {
		carpet: 'carpet',
		leather: 'leather',
		vinyl: 'vinyl'
	},
	parts: {
		board: 'board',
		dashboard: 'main-boat-elements',
		fillDeck: 'fill-deck',
		seatSegment1: 'seat-segment-1',
		seatSegment2: 'seat-segment-2',
		sideSegment1: 'boat-inner-side-segment-1',
		sideSegment2: 'boat-inner-side-segment-2'
	}
}
