'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FAQ } from '@/components/FAQ'
import { Save, Plus, Trash2, ArrowLeft, RotateCcw, AlertCircle } from 'lucide-react'

interface FAQItem {
  q: string
  a: string
}

interface ValidationError {
  index: number
  field: 'q' | 'a'
  message: string
}

const STORAGE_KEY = 'faqEntries'
const MIN_ITEMS = 4
const MAX_ITEMS = 6
const MAX_QUESTION_LENGTH = 120
const MAX_ANSWER_LENGTH = 500

export default function FAQEditorPage() {
  const router = useRouter()
  const [faqItems, setFaqItems] = useState<FAQItem[]>([])
  const [initialItems, setInitialItems] = useState<FAQItem[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [storageAvailable, setStorageAvailable] = useState(true)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      router.push('/')
      return
    }

    checkStorageAvailability()
    loadFAQs()
  }, [router])

  const checkStorageAvailability = () => {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      setStorageAvailable(true)
    } catch (e) {
      setStorageAvailable(false)
      showToast('LocalStorage is unavailable. Changes will only persist during this session.', 'warning')
    }
  }

  const loadFAQs = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setFaqItems(parsed)
        setInitialItems(JSON.parse(JSON.stringify(parsed)))
      } else {
        const defaultFAQs: FAQItem[] = [
          { q: 'Is parking available at the venue?', a: "Yes! There's a large parking lot on site with plenty of spaces. Valet service will also be available." },
          { q: 'Can I bring my children?', a: "We love your little ones, but we've planned an adults-only celebration. We hope you understand and can enjoy a night out!" },
          { q: 'What should I bring as a gift?', a: "Your presence is the greatest gift! If you'd like to give something, we have a registry at [Store Name] or would appreciate contributions to our honeymoon fund." },
          { q: 'Is the venue wheelchair accessible?', a: 'Yes, Green Grove Hall is fully accessible with ramps, accessible restrooms, and reserved parking spaces near the entrance.' },
        ]
        setFaqItems(defaultFAQs)
        setInitialItems(JSON.parse(JSON.stringify(defaultFAQs)))
      }
    } catch (error) {
      console.error('Error loading FAQs:', error)
      showToast('Failed to load FAQs', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 5000)
  }

  const validateFAQs = (): boolean => {
    const errors: ValidationError[] = []

    faqItems.forEach((item, index) => {
      const trimmedQ = item.q.trim()
      const trimmedA = item.a.trim()

      if (!trimmedQ) {
        errors.push({ index, field: 'q', message: 'Question is required' })
      } else if (trimmedQ.length > MAX_QUESTION_LENGTH) {
        errors.push({ index, field: 'q', message: 'Question must be ' + MAX_QUESTION_LENGTH + ' characters or less (' + trimmedQ.length + '/' + MAX_QUESTION_LENGTH + ')' })
      }

      if (!trimmedA) {
        errors.push({ index, field: 'a', message: 'Answer is required' })
      } else if (trimmedA.length > MAX_ANSWER_LENGTH) {
        errors.push({ index, field: 'a', message: 'Answer must be ' + MAX_ANSWER_LENGTH + ' characters or less (' + trimmedA.length + '/' + MAX_ANSWER_LENGTH + ')' })
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }

  const getFieldError = (index: number, field: 'q' | 'a'): string | undefined => {
    return validationErrors.find(e => e.index === index && e.field === field)?.message
  }

  const handleSave = () => {
    if (!validateFAQs()) {
      showToast('Please fix validation errors before saving', 'error')
      return
    }

    try {
      if (storageAvailable) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(faqItems))
      }
      setInitialItems(JSON.parse(JSON.stringify(faqItems)))
      setValidationErrors([])
      showToast('FAQ changes saved successfully!', 'success')
    } catch (error) {
      console.error('Error saving FAQs:', error)
      showToast('Failed to save changes', 'error')
    }
  }

  const handleReset = () => {
    setFaqItems(JSON.parse(JSON.stringify(initialItems)))
    setValidationErrors([])
    showToast('Changes reverted to last saved state', 'success')
  }

  const handleAddItem = () => {
    if (faqItems.length >= MAX_ITEMS) {
      showToast('Maximum of ' + MAX_ITEMS + ' FAQ items allowed', 'error')
      return
    }
    setFaqItems([...faqItems, { q: '', a: '' }])
  }

  const handleRemoveItem = (index: number) => {
    if (faqItems.length <= MIN_ITEMS) {
      showToast('Minimum of ' + MIN_ITEMS + ' FAQ items required', 'error')
      return
    }
    setFaqItems(faqItems.filter((_, i) => i !== index))
    setValidationErrors(validationErrors.filter(e => e.index !== index))
  }

  const handleUpdateItem = (index: number, field: 'q' | 'a', value: string) => {
    const newItems = [...faqItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setFaqItems(newItems)
    setValidationErrors(validationErrors.filter(e => !(e.index === index && e.field === field)))
  }

  const getCharCount = (text: string, max: number) => {
    const count = text.trim().length
    const remaining = max - count
    const isOverLimit = count > max
    return {
      count,
      remaining,
      isOverLimit,
      display: count + '/' + max + (remaining >= 0 ? ' (' + remaining + ' remaining)' : ' (over limit)')
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">FAQ Editor</h1>
            <p className="text-gray-600">Edit your wedding FAQ ({faqItems.length}/{MAX_ITEMS} items)</p>
            {!storageAvailable && (
              <div className="mt-2 flex items-center gap-2 text-amber-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>LocalStorage unavailable - changes saved in memory only</span>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={() => router.push('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {toast && (
          <div
            className={'mb-6 p-4 rounded-lg border flex items-center gap-3 ' + 
              (toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 
               toast.type === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
               'bg-red-50 text-red-800 border-red-200')}
          >
            {toast.type === 'warning' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span>{toast.message}</span>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Edit FAQs</h2>
                <div className="text-sm text-gray-600">
                  {MIN_ITEMS}-{MAX_ITEMS} items
                </div>
              </div>

              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">FAQ #{index + 1}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        disabled={faqItems.length <= MIN_ITEMS}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        aria-label={'Remove FAQ ' + (index + 1)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Label htmlFor={'question-' + index}>
                        Question <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={'question-' + index}
                        type="text"
                        value={item.q}
                        onChange={(e) => handleUpdateItem(index, 'q', e.target.value)}
                        placeholder="Enter your question"
                        className={(getFieldError(index, 'q') || getCharCount(item.q, MAX_QUESTION_LENGTH).isOverLimit) ? 'border-red-500' : ''}
                        aria-invalid={!!getFieldError(index, 'q')}
                        aria-describedby={getFieldError(index, 'q') ? 'question-error-' + index : undefined}
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className={'text-xs ' + (getCharCount(item.q, MAX_QUESTION_LENGTH).isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500')}>
                          {getCharCount(item.q, MAX_QUESTION_LENGTH).display}
                        </span>
                      </div>
                      {getFieldError(index, 'q') && (
                        <p id={'question-error-' + index} className="text-sm text-red-600 mt-1">
                          {getFieldError(index, 'q')}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={'answer-' + index}>
                        Answer <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id={'answer-' + index}
                        value={item.a}
                        onChange={(e) => handleUpdateItem(index, 'a', e.target.value)}
                        placeholder="Enter your answer"
                        rows={4}
                        className={(getFieldError(index, 'a') || getCharCount(item.a, MAX_ANSWER_LENGTH).isOverLimit) ? 'border-red-500' : ''}
                        aria-invalid={!!getFieldError(index, 'a')}
                        aria-describedby={getFieldError(index, 'a') ? 'answer-error-' + index : undefined}
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className={'text-xs ' + (getCharCount(item.a, MAX_ANSWER_LENGTH).isOverLimit ? 'text-red-600 font-medium' : 'text-gray-500')}>
                          {getCharCount(item.a, MAX_ANSWER_LENGTH).display}
                        </span>
                      </div>
                      {getFieldError(index, 'a') && (
                        <p id={'answer-error-' + index} className="text-sm text-red-600 mt-1">
                          {getFieldError(index, 'a')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={handleAddItem}
                  disabled={faqItems.length >= MAX_ITEMS}
                  className="w-full h-12"
                  aria-label="Add new FAQ item"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add FAQ Item {faqItems.length >= MAX_ITEMS && '(Maximum reached)'}
                </Button>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white h-12"
                  aria-label="Save FAQ changes"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 h-12"
                  aria-label="Reset to last saved state"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Preview</h2>
              <p className="text-sm text-gray-600 mb-4">
                This is how your FAQs will appear on the wedding site
              </p>
            </div>
            <div className="bg-rose-50 rounded-lg overflow-hidden">
              <FAQ items={faqItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
