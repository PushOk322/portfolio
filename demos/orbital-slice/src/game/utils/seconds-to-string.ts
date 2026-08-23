export default function secondsToString(second: number): string {
  const hours = Math.floor(second / 3600)
  const minutes = Math.floor((second % 3600) / 60)
  const seconds = second % 60
  const pad = (num: number): string => (num < 10 ? `0${num}` : `${num}`)

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
