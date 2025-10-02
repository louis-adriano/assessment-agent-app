'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Trash2,
  Target,
  AlertTriangle,
  CheckCircle2,
  Info,
  Star,
  Lightbulb,
  Edit,
  X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

interface RubricCriterion {
  id: string
  title: string
  description: string
  points: number
  levels: {
    excellent: string
    good: string
    canImprove: string
    needsImprovement: string
  }
}

interface RubricManagerProps {
  criteria: string[]
  redFlags: string[]
  conditionalChecks: string[]
  onCriteriaChange: (criteria: string[]) => void
  onRedFlagsChange: (redFlags: string[]) => void
  onConditionalChecksChange: (conditionalChecks: string[]) => void
  submissionType?: string
}

export default function RubricManager({
  criteria,
  redFlags,
  conditionalChecks,
  onCriteriaChange,
  onRedFlagsChange,
  onConditionalChecksChange,
  submissionType = 'TEXT'
}: RubricManagerProps) {
  const [newCriterion, setNewCriterion] = useState('')
  const [newRedFlag, setNewRedFlag] = useState('')
  const [newConditionalCheck, setNewConditionalCheck] = useState('')
  const [showRubricBuilder, setShowRubricBuilder] = useState(false)
  const [advancedRubric, setAdvancedRubric] = useState<RubricCriterion[]>([])

  // Predefined criteria templates based on submission type
  const getCriteriaTemplates = (type: string) => {
    const templates = {
      TEXT: [
        'Clear and well-structured writing',
        'Addresses all required points',
        'Uses appropriate technical terminology',
        'Provides specific examples or evidence',
        'Demonstrates critical thinking',
        'Proper grammar and spelling'
      ],
      DOCUMENT: [
        'Professional formatting and presentation',
        'Complete content covering all requirements',
        'Proper use of headings and structure',
        'Includes required sections or elements',
        'Clear and readable layout',
        'Appropriate length and detail'
      ],
      GITHUB_REPO: [
        'Code follows best practices and conventions',
        'Repository includes comprehensive README',
        'Code is well-commented and documented',
        'Project structure is logical and organized',
        'Includes proper version control history',
        'Working code with no critical errors'
      ],
      WEBSITE: [
        'Site is fully functional and accessible',
        'Professional design and user experience',
        'Content is complete and well-organized',
        'Responsive design works on different devices',
        'Fast loading times and good performance',
        'Meets accessibility standards'
      ],
      SCREENSHOT: [
        'Image clearly shows required elements',
        'High quality and properly cropped',
        'All requested features are visible',
        'Proper annotations or labels if required',
        'Demonstrates completion of task',
        'Professional presentation'
      ]
    }
    return templates[type as keyof typeof templates] || templates.TEXT
  }

  const getRedFlagTemplates = (type: string) => {
    const templates = {
      TEXT: [
        'Off-topic or irrelevant content',
        'Plagiarism or copied content',
        'Extremely poor grammar affecting readability',
        'Missing key required elements',
        'Factually incorrect information',
        'Inappropriate language or tone'
      ],
      DOCUMENT: [
        'Incomplete or missing sections',
        'Unprofessional formatting',
        'Wrong file format or corrupted file',
        'Plagiarized content',
        'Significantly under required length',
        'Missing required citations or references'
      ],
      GITHUB_REPO: [
        'Repository is empty or incomplete',
        'Code does not run or has critical errors',
        'No documentation or README',
        'Plagiarized or copied code without attribution',
        'Does not meet basic project requirements',
        'Security vulnerabilities or bad practices'
      ],
      WEBSITE: [
        'Site is not accessible or broken',
        'Major functionality issues',
        'Unprofessional design or layout',
        'Missing required pages or content',
        'Security issues or vulnerabilities',
        'Does not work on mobile devices'
      ],
      SCREENSHOT: [
        'Image is blurry or unreadable',
        'Does not show required elements',
        'Wrong format or corrupted file',
        'Shows incomplete or incorrect work',
        'Missing required annotations',
        'Professional standards not met'
      ]
    }
    return templates[type as keyof typeof templates] || templates.TEXT
  }

  const addCriterion = () => {
    if (newCriterion.trim()) {
      onCriteriaChange([...criteria, newCriterion.trim()])
      setNewCriterion('')
    }
  }

  const removeCriterion = (index: number) => {
    onCriteriaChange(criteria.filter((_, i) => i !== index))
  }

  const addRedFlag = () => {
    if (newRedFlag.trim()) {
      onRedFlagsChange([...redFlags, newRedFlag.trim()])
      setNewRedFlag('')
    }
  }

  const removeRedFlag = (index: number) => {
    onRedFlagsChange(redFlags.filter((_, i) => i !== index))
  }

  const addConditionalCheck = () => {
    if (newConditionalCheck.trim()) {
      onConditionalChecksChange([...conditionalChecks, newConditionalCheck.trim()])
      setNewConditionalCheck('')
    }
  }

  const removeConditionalCheck = (index: number) => {
    onConditionalChecksChange(conditionalChecks.filter((_, i) => i !== index))
  }

  const addTemplateItems = (items: string[], type: 'criteria' | 'redFlags' | 'conditionalChecks') => {
    switch (type) {
      case 'criteria':
        onCriteriaChange([...criteria, ...items.filter(item => !criteria.includes(item))])
        break
      case 'redFlags':
        onRedFlagsChange([...redFlags, ...items.filter(item => !redFlags.includes(item))])
        break
      case 'conditionalChecks':
        onConditionalChecksChange([...conditionalChecks, ...items.filter(item => !conditionalChecks.includes(item))])
        break
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="criteria" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="criteria" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Assessment Criteria
          </TabsTrigger>
          <TabsTrigger value="redFlags" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Red Flags
          </TabsTrigger>
          <TabsTrigger value="bonuses" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Bonus Checks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="criteria" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                Assessment Criteria
              </CardTitle>
              <CardDescription>
                Define what students must include to receive full marks. The AI will check for these elements.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Templates */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-blue-600" />
                  Quick Templates for {submissionType.replace('_', ' ')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getCriteriaTemplates(submissionType).map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => addTemplateItems([template], 'criteria')}
                      disabled={criteria.includes(template)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {template}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Add new criterion */}
              <div className="flex gap-2">
                <Input
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  placeholder="Enter a new assessment criterion..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addCriterion()}
                />
                <Button onClick={addCriterion} disabled={!newCriterion.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Current criteria */}
              <div className="space-y-2">
                {criteria.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No criteria defined yet. Add criteria above or use templates.</p>
                  </div>
                ) : (
                  criteria.map((criterion, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="flex-1 text-sm">{criterion}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCriterion(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {criteria.length > 0 && (
                <div className="text-sm text-gray-600">
                  <Info className="h-4 w-4 inline mr-1" />
                  The AI will check submissions against these {criteria.length} criteria for full marks.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redFlags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Red Flags (Automatic Deductions)
              </CardTitle>
              <CardDescription>
                Define issues that will result in lower grades or automatic failures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Templates */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Common Red Flags for {submissionType.replace('_', ' ')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {getRedFlagTemplates(submissionType).map((template, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => addTemplateItems([template], 'redFlags')}
                      disabled={redFlags.includes(template)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {template}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Add new red flag */}
              <div className="flex gap-2">
                <Input
                  value={newRedFlag}
                  onChange={(e) => setNewRedFlag(e.target.value)}
                  placeholder="Enter a red flag issue..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addRedFlag()}
                />
                <Button onClick={addRedFlag} disabled={!newRedFlag.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Current red flags */}
              <div className="space-y-2">
                {redFlags.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No red flags defined yet. Add issues that should result in grade deductions.</p>
                  </div>
                ) : (
                  redFlags.map((redFlag, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <span className="flex-1 text-sm">{redFlag}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRedFlag(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {redFlags.length > 0 && (
                <div className="text-sm text-gray-600">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  The AI will automatically flag these {redFlags.length} issues for grade deductions.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bonuses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-600" />
                Conditional Checks (Bonus Points)
              </CardTitle>
              <CardDescription>
                Define conditional logic for bonus points or additional recognition.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Examples */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-600" />
                  Example Bonus Checks
                </h4>
                <div className="grid gap-2 text-sm text-purple-800">
                  <p>• "If examples are detailed and specific, bonus points"</p>
                  <p>• "If implementation exceeds requirements, excellent rating"</p>
                  <p>• "If creative approach is used, bonus recognition"</p>
                  <p>• "If code includes advanced features, additional points"</p>
                </div>
              </div>

              {/* Add new conditional check */}
              <div className="flex gap-2">
                <Input
                  value={newConditionalCheck}
                  onChange={(e) => setNewConditionalCheck(e.target.value)}
                  placeholder="If [condition], then [bonus]..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addConditionalCheck()}
                />
                <Button onClick={addConditionalCheck} disabled={!newConditionalCheck.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Current conditional checks */}
              <div className="space-y-2">
                {conditionalChecks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No bonus checks defined yet. Add conditions for extra recognition.</p>
                  </div>
                ) : (
                  conditionalChecks.map((check, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <Star className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      <span className="flex-1 text-sm">{check}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeConditionalCheck(index)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {conditionalChecks.length > 0 && (
                <div className="text-sm text-gray-600">
                  <Star className="h-4 w-4 inline mr-1" />
                  The AI will check for these {conditionalChecks.length} bonus conditions.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Grading Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{criteria.length}</div>
              <div className="text-sm text-green-600">Required Criteria</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-700">{redFlags.length}</div>
              <div className="text-sm text-red-600">Red Flags</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{conditionalChecks.length}</div>
              <div className="text-sm text-purple-600">Bonus Checks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}