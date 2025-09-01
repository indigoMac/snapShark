import { describe, it, expect } from 'vitest'
import {
  isInputFormatSupported,
  isOutputFormatSupported,
  isLossyFormat,
  getFileExtension,
  generateFilename,
  FORMAT_EXTENSIONS,
  SUPPORTED_INPUT_FORMATS,
  SUPPORTED_OUTPUT_FORMATS
} from './formats'

describe('formats', () => {
  describe('isInputFormatSupported', () => {
    it('should return true for supported input formats', () => {
      expect(isInputFormatSupported('image/jpeg')).toBe(true)
      expect(isInputFormatSupported('image/png')).toBe(true)
      expect(isInputFormatSupported('image/webp')).toBe(true)
      expect(isInputFormatSupported('image/heic')).toBe(true)
    })

    it('should return false for unsupported formats', () => {
      expect(isInputFormatSupported('image/gif')).toBe(false)
      expect(isInputFormatSupported('image/bmp')).toBe(false)
      expect(isInputFormatSupported('text/plain')).toBe(false)
    })
  })

  describe('isOutputFormatSupported', () => {
    it('should return true for supported output formats', () => {
      expect(isOutputFormatSupported('image/jpeg')).toBe(true)
      expect(isOutputFormatSupported('image/png')).toBe(true)
      expect(isOutputFormatSupported('image/webp')).toBe(true)
      expect(isOutputFormatSupported('image/avif')).toBe(true)
    })

    it('should return false for unsupported output formats', () => {
      expect(isOutputFormatSupported('image/heic')).toBe(false)
      expect(isOutputFormatSupported('image/gif')).toBe(false)
    })
  })

  describe('isLossyFormat', () => {
    it('should return true for lossy formats', () => {
      expect(isLossyFormat('image/jpeg')).toBe(true)
      expect(isLossyFormat('image/webp')).toBe(true)
      expect(isLossyFormat('image/avif')).toBe(true)
    })

    it('should return false for lossless formats', () => {
      expect(isLossyFormat('image/png')).toBe(false)
    })
  })

  describe('getFileExtension', () => {
    it('should return correct extensions', () => {
      expect(getFileExtension('image/jpeg')).toBe('jpg')
      expect(getFileExtension('image/png')).toBe('png')
      expect(getFileExtension('image/webp')).toBe('webp')
      expect(getFileExtension('image/avif')).toBe('avif')
    })
  })

  describe('generateFilename', () => {
    it('should generate correct filenames', () => {
      expect(generateFilename('photo.jpg', 800, 600, 'image/webp'))
        .toBe('photo_800x600.webp')
      
      expect(generateFilename('image.png', 1920, 1080, 'image/jpeg'))
        .toBe('image_1920x1080.jpg')
    })

    it('should handle filenames without extensions', () => {
      expect(generateFilename('photo', 800, 600, 'image/png'))
        .toBe('photo_800x600.png')
    })
  })

  describe('constants', () => {
    it('should have valid format constants', () => {
      expect(SUPPORTED_INPUT_FORMATS.length).toBeGreaterThan(0)
      expect(SUPPORTED_OUTPUT_FORMATS.length).toBeGreaterThan(0)
      expect(Object.keys(FORMAT_EXTENSIONS).length).toBe(SUPPORTED_OUTPUT_FORMATS.length)
    })
  })
})
