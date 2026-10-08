/**
 * Photo Integration Types for Charlie News (Unsplash)
 */

export type PhotoSource = 'Unsplash' | 'Pexels' | 'Upload'

export interface SelectedPhoto {
  found: true
  source: 'Unsplash'
  url: string
  width: number
  height: number
  alt: string
  photographer: string
  photographerUrl?: string
  creditLink: string
  sourceId: string
  downloadLocation?: string
}

export interface PhotoNotFound {
  found: false
  reason: string
  unsplashNotice?: string
  error?: string
}

export type PhotoResolveResult = SelectedPhoto | PhotoNotFound

export interface PhotoSearchOptions {
  minWidth?: number
  useMock?: boolean
  mockUnsplashPhoto?: Partial<SelectedPhoto> | null
  forceFailUnsplash?: boolean
}
