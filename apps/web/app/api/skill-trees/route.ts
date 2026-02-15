import { NextResponse } from 'next/server'
import { getAllTreeNames, getSkillTree } from '@gladiator/shared/src/skills/skill-trees'

/**
 * GET /api/skill-trees
 * Return all 6 skill trees for the client
 */
export async function GET() {
  try {
    const treeNames = getAllTreeNames()
    const trees: Record<string, any[]> = {}

    for (const treeName of treeNames) {
      trees[treeName] = getSkillTree(treeName)
    }

    return NextResponse.json({
      trees,
    })
  } catch (error) {
    console.error('Error fetching skill trees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch skill trees' },
      { status: 500 }
    )
  }
}
