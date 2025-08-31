export type DBARiskLevel = 'safe' | 'doubtful' | 'high_risk'

export function getRiskLevelDescription(riskLevel: DBARiskLevel, locale: string): string {
  const descriptions = {
    safe: {
      en: 'SAFE - Independent Contractor',
      nl: 'VEILIG - Zelfstandig Ondernemer'
    },
    doubtful: {
      en: 'DOUBTFUL - Requires Review',
      nl: 'TWIJFELACHTIG - Vereist Beoordeling'
    },
    high_risk: {
      en: 'HIGH RISK - Employee Relationship',
      nl: 'HOOG RISICO - Werknemersrelatie'
    }
  }
  
  return descriptions[riskLevel]?.[locale as keyof typeof descriptions[riskLevel]] || descriptions.safe.en
}








