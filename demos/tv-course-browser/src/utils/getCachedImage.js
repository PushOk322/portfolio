export const getCachedImage = (url, imageCache) => {
	if (imageCache && imageCache instanceof Map) {
		const img = imageCache.get(url)
		return img ? img.src : url // Return image source if found, otherwise return the original URL
	}
	return url // Return the original URL if no cache is available
}
