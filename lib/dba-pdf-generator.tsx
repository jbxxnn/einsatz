import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Database } from "@/lib/database.types"
import { getRiskLevelDescription, type DBARiskLevel } from './dba-scoring'

type DBAQuestion = Database["public"]["Tables"]["dba_questions"]["Row"]
type DBAFreelancerAnswer = Database["public"]["Tables"]["dba_freelancer_answers"]["Row"]
type DBABookingAnswer = Database["public"]["Tables"]["dba_booking_answers"]["Row"]

// Register fonts (you'll need to add these fonts to your project)
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
})

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter'
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 5
  },
  date: {
    fontSize: 12,
    color: '#9ca3af'
  },
  section: {
    marginBottom: 25
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 5
  },
  scoreCard: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    border: '1px solid #e5e7eb'
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  scoreLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: 'bold'
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  riskLevel: {
    fontSize: 14,
    padding: '8px 12px',
    borderRadius: 4,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  riskSafe: {
    backgroundColor: '#dcfce7',
    color: '#166534'
  },
  riskDoubtful: {
    backgroundColor: '#fef3c7',
    color: '#92400e'
  },
  riskHigh: {
    backgroundColor: '#fee2e2',
    color: '#991b1b'
  },
  categorySection: {
    marginBottom: 20
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10
  },
  questionItem: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    border: '1px solid #e5e7eb'
  },
  questionText: {
    fontSize: 12,
    color: '#1f2937',
    marginBottom: 8,
    fontWeight: 'bold'
  },
  answerText: {
    fontSize: 11,
    color: '#6b7280',
    fontStyle: 'italic'
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #e5e7eb',
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center'
  },
  disclaimer: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    border: '1px solid #e5e7eb'
  }
})

interface DBAReportData {
  bookingId: string
  freelancerName: string
  clientName: string
  jobCategory: string
  score: number
  riskLevel: DBARiskLevel
  categoryScores: Record<string, number>
  freelancerAnswers: (DBAFreelancerAnswer & { dba_questions: DBAQuestion })[]
  bookingAnswers: (DBABookingAnswer & { dba_questions: DBAQuestion })[]
  questions: DBAQuestion[]
  generatedAt: Date
  locale: string
}

const categoryLabels = {
  control: { en: "Control & Supervision", nl: "Controle & Begeleiding" },
  substitution: { en: "Substitution", nl: "Vervangbaarheid" },
  tools: { en: "Tools & Equipment", nl: "Gereedschap & Apparatuur" },
  risk: { en: "Financial Risk", nl: "Financieel Risico" },
  economic_independence: { en: "Economic Independence", nl: "Economische Onafhankelijkheid" }
}

export function generateDBAReport(data: DBAReportData) {
  
  const getCategoryLabel = (category: string) => {
    const labels = categoryLabels[category as keyof typeof categoryLabels]
    return data.locale === "nl" ? labels.nl : labels.en
  }

  const getRiskLevelStyle = (riskLevel: DBARiskLevel) => {
    switch (riskLevel) {
      case "safe":
        return [styles.riskLevel, styles.riskSafe]
      case "doubtful":
        return [styles.riskLevel, styles.riskDoubtful]
      case "high_risk":
        return [styles.riskLevel, styles.riskHigh]
      default:
        return [styles.riskLevel, styles.riskSafe]
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#166534'
    if (score >= 40) return '#92400e'
    return '#991b1b'
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {data.locale === "nl" ? "DBA Compliance Rapport" : "DBA Compliance Report"}
          </Text>
          <Text style={styles.subtitle}>
            {data.locale === "nl" ? "Declaratie van Arbeidsrelatie" : "Declaration of Labor Relations"}
          </Text>
          <Text style={styles.date}>
            {data.generatedAt.toLocaleDateString(data.locale === "nl" ? "nl-NL" : "en-US", {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Booking Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {data.locale === "nl" ? "Boeking Informatie" : "Booking Information"}
          </Text>
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                {data.locale === "nl" ? "Boeking ID" : "Booking ID"}
              </Text>
              <Text style={styles.scoreValue}>{data.bookingId}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                {data.locale === "nl" ? "Freelancer" : "Freelancer"}
              </Text>
              <Text style={styles.scoreValue}>{data.freelancerName}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                {data.locale === "nl" ? "Opdrachtgever" : "Client"}
              </Text>
              <Text style={styles.scoreValue}>{data.clientName}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                {data.locale === "nl" ? "Werkcategorie" : "Job Category"}
              </Text>
              <Text style={styles.scoreValue}>{data.jobCategory}</Text>
            </View>
          </View>
        </View>

        {/* Overall Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {data.locale === "nl" ? "Compliance Score" : "Compliance Score"}
          </Text>
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                {data.locale === "nl" ? "Totale Score" : "Overall Score"}
              </Text>
              <Text style={[styles.scoreValue, { color: getScoreColor(data.score) }]}>
                {data.score}%
              </Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreLabel}>
                {data.locale === "nl" ? "Risico Niveau" : "Risk Level"}
              </Text>
              <Text style={getRiskLevelStyle(data.riskLevel)}>
                {getRiskLevelDescription(data.riskLevel, data.locale)}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Scores */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {data.locale === "nl" ? "Categorie Scores" : "Category Scores"}
          </Text>
          {Object.entries(data.categoryScores).map(([category, score]) => (
            <View key={category} style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>{getCategoryLabel(category)}</Text>
                <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>
                  {Math.round(score)}%
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Detailed Answers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {data.locale === "nl" ? "Gedetailleerde Antwoorden" : "Detailed Answers"}
          </Text>
          
          {/* Freelancer Answers */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {data.locale === "nl" ? "Freelancer Antwoorden" : "Freelancer Answers"}
            </Text>
            {data.freelancerAnswers.map((answer) => (
              <View key={answer.id} style={styles.questionItem}>
                <Text style={styles.questionText}>
                  {data.locale === "nl" ? answer.dba_questions.question_text_nl : answer.dba_questions.question_text_en}
                </Text>
                <Text style={styles.answerText}>
                  {data.locale === "nl" ? "Antwoord" : "Answer"}: {answer.answer_value}
                </Text>
              </View>
            ))}
          </View>

          {/* Client Answers */}
          <View style={styles.categorySection}>
            <Text style={styles.categoryTitle}>
              {data.locale === "nl" ? "Opdrachtgever Antwoorden" : "Client Answers"}
            </Text>
            {data.bookingAnswers.map((answer) => (
              <View key={answer.id} style={styles.questionItem}>
                <Text style={styles.questionText}>
                  {data.locale === "nl" ? answer.dba_questions.question_text_nl : answer.dba_questions.question_text_en}
                </Text>
                <Text style={styles.answerText}>
                  {data.locale === "nl" ? "Antwoord" : "Answer"}: {answer.answer_value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>
            {data.locale === "nl" 
              ? "Dit rapport is gegenereerd op basis van de ingevulde DBA vragenlijsten. Het dient als indicatie en vervangt geen professioneel juridisch advies. Voor definitieve beoordeling van de arbeidsrelatie wordt geadviseerd om een arbeidsrechtadvocaat te raadplegen."
              : "This report is generated based on the completed DBA questionnaires. It serves as an indication and does not replace professional legal advice. For final assessment of the employment relationship, it is advised to consult an employment law attorney."
            }
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {data.locale === "nl" 
              ? "Einsatz Platform - DBA Compliance Rapport"
              : "Einsatz Platform - DBA Compliance Report"
            }
          </Text>
          <Text>
            {data.locale === "nl" 
              ? "Gegenereerd op" : "Generated on"
            }: {data.generatedAt.toLocaleDateString(data.locale === "nl" ? "nl-NL" : "en-US")}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

 