import React, { useEffect, useState, useRef, useContext } from 'react'
import './Video.scss'
import ReactPlayer from 'react-player'
import Control from './Control/Control.jsx'
import Container from '../../containers/Container/Container.jsx'
import { formatTime } from '../../../utils/formatTIme.js'
import useFocusableWithScroll from '../../../hooks/useFocusableWIthScroll.jsx'
import {
	FocusContext,
	getCurrentFocusKey
} from '@noriginmedia/norigin-spatial-navigation'
import { useNavigate, useParams } from 'react-router-dom'
import { PATH } from '../../../constants/index.js'
import useUserStore from '../../../store/useUserStore.js'
import useGeneralStore from '../../../store/useGeneralStore.js'
import useVideoStore from '../../../store/useVideoStore.js'
import useCourseStore from '../../../store/useCourseStore.js'

let count = 0
const VideoPage = () => {
	const { ref, focusKey, hasFocusedChild, focusSelf } = useFocusableWithScroll({
		trackChildren: true
	})
	const { authenticated } = useUserStore((state) => ({
		authenticated: state.authenticated
	}))

	const navigate = useNavigate()

	const { data, setHeaderHidden } = useGeneralStore((state) => ({
		data: state.data,
		setHeaderHidden: state.setHeaderHidden
	}))
	const urlParams = useParams()

	const { currentVideoId, setCurrentVideoId } = useVideoStore((state) => ({
		currentVideoId: state.currentVideoId,
		setCurrentVideoId: state.setCurrentVideoId
	}))

	const { courseId } = useCourseStore((state) => ({
		courseId: state.id
	}))

	const course = data?.find((item) => item.id === courseId)
	const video = course?.videos.find((item) => item.id === currentVideoId)

	const videoPlayerRef = useRef(null)
	const controlRef = useRef(null)

	const [videoState, setVideoState] = useState({
		playing: true,
		muted: false,
		volume: 0.5,
		playbackRate: 1.0,
		played: 0,
		seeking: false,
		buffer: true
	})

	const [lastFocusKey, setLastFocusKey] = useState(getCurrentFocusKey())
	const [focusChangedRecently, setFocusChangedRecently] = useState(false)
	const [videoReady, setVideoReady] = useState(false) // New state for tracking video readiness

	const { playing, muted, volume, playbackRate, played, seeking, buffer } =
		videoState

	const currentTime = videoPlayerRef.current
		? videoPlayerRef.current.getCurrentTime()
		: '00:00'
	const duration = videoPlayerRef.current
		? videoPlayerRef.current.getDuration()
		: '00:00'

	useEffect(() => {
		setHeaderHidden(true)

		return () => {
			setHeaderHidden(false)
		}
	}, [authenticated, video, navigate])

	const getNextVideoId = () => {
		const currentIndex = course.videos?.findIndex(
			(item) => item.id === currentVideoId
		)

		if (currentIndex !== -1 && currentIndex < course.videos.length - 1) {
			return course.videos[currentIndex + 1].id
		}

		return null
	}

	const getPreviousVideoId = () => {
		const currentIndex = course.videos?.findIndex(
			(item) => item.id === currentVideoId
		)

		if (currentIndex !== -1 && currentIndex > 0) {
			return course.videos[currentIndex - 1].id
		}

		return null
	}

	useEffect(() => {
		focusSelf()
	}, [hasFocusedChild, lastFocusKey, getCurrentFocusKey])

	const formatCurrentTime = formatTime(currentTime)
	const formatDuration = formatTime(duration)

	const playPauseHandler = () => {
		setVideoState({ ...videoState, playing: !videoState.playing })
	}

	const rewindHandler = () => {
		const prevVideoId = getPreviousVideoId()

		if (prevVideoId) {
			const prevVideo = course.videos.find((video) => video.id === prevVideoId)

			if (
				(!authenticated || !prevVideo.is_paid) &&
				prevVideo.type !== 'intro'
			) {
				navigate(`/${PATH.AUTH}`)
				return
			}

			setCurrentVideoId(prevVideoId)
		} else {
			navigate(`/${PATH.COURSES}/${course.id}`)
		}
	}

	const handleFastForward = () => {
		const nextVideoId = getNextVideoId()

		if (nextVideoId) {
			const nextVideo = course.videos.find((video) => video.id === nextVideoId)

			if (
				(!authenticated || !nextVideo.is_paid) &&
				!nextVideo.type !== 'intro'
			) {
				navigate(`/${PATH.AUTH}`)
				return
			}

			setCurrentVideoId(nextVideoId)
		} else {
			navigate(`/${PATH.COURSES}/${course.id}`)
		}
	}

	const progressHandler = (state) => {
		if (count > 3) {
			controlRef.current.style.visibility = 'hidden'
		} else if (controlRef.current.style.visibility === 'visible') {
			count += 1
		}

		if (!seeking) {
			setVideoState({ ...videoState, ...state })
		}
	}

	const progressArrowsHandler = (direction) => {
		if (direction === 'left') {
			videoPlayerRef.current.seekTo(videoPlayerRef.current.getCurrentTime() - 5)
		}
		if (direction === 'right') {
			videoPlayerRef.current.seekTo(
				videoPlayerRef.current.getCurrentTime() + 10
			)
		}
	}

	const onReadyHandler = () => {
		setVideoReady(true)
	}

	const handleVideoEnd = () => {
		const nextVideoId = getNextVideoId()
		if (nextVideoId) {
			if (!authenticated || !nextVideoId.isPaid) {
				navigate(`/${PATH.AUTH}`)
				return
			}
			setCurrentVideoId(nextVideoId)
		} else {
			navigate(`/${PATH.COURSES}/${course.id}`)
		}
	}

	return (
		<FocusContext.Provider value={focusKey}>
			<Container variant='fullscreen' ref={ref}>
				<div className='video-page'>
					<div className='video-page__player-wrapper'>
						{/* {!videoReady && (
							<img
								src={video.preview}
								alt='Video Preview'
								className='video-page__preview-image'
							/>
						)} */}
						<ReactPlayer
							ref={videoPlayerRef}
							className='player'
							url={video?.video}
							width='100vw'
							height='100vh'
							playing={playing}
							volume={volume}
							muted={muted}
							onReady={onReadyHandler} // Set video as ready when it starts
							onProgress={progressHandler}
							onEnded={handleVideoEnd}
						/>

						<Control
							isHidden={!focusChangedRecently}
							controlRef={controlRef}
							progressHandler={progressArrowsHandler}
							onPlayPause={playPauseHandler}
							playing={playing}
							onRewind={rewindHandler}
							onForward={handleFastForward}
							played={played}
							playRate={playbackRate}
							formattedDuration={formatDuration}
							formattedCurrentTime={formatCurrentTime}
							duration={duration}
							currentTime={currentTime}
							name={video?.name}
						/>
					</div>
				</div>
			</Container>
		</FocusContext.Provider>
	)
}

export default VideoPage
