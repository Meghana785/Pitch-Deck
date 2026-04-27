import fitz
import os

def create_saas_deck():
    doc = fitz.open()
    page = doc.new_page()
    
    # Use standard Helvetica font
    title_font = "helv"
    
    # Content
    y = 50
    page.insert_text((50, y), "Velocity CRM: Strategic Intelligence for Mid-Market Sales", fontsize=18)
    y += 40
    page.insert_text((50, y), "1. The Problem: 'The CRM Black Hole'", fontsize=14)
    y += 20
    page.insert_text((50, y), "- Mid-market sales teams spend 12 hours/week on manual data entry.", fontsize=11)
    y += 15
    page.insert_text((50, y), "- Data in current CRMs is 40% stale, leading to $2.1M in missed revenue.", fontsize=11)
    
    y += 40
    page.insert_text((50, y), "2. The Solution: Predictive Sales Orchestration", fontsize=14)
    y += 20
    page.insert_text((50, y), "- AI-native workspace that auto-populates data from Gmail and Slack.", fontsize=11)
    y += 15
    page.insert_text((50, y), "- DealPulse algorithm identifies at-risk deals 3 weeks in advance.", fontsize=11)

    y += 40
    page.insert_text((50, y), "3. Traction & Metrics (SaaS Performance)", fontsize=14)
    y += 20
    page.insert_text((50, y), "- Current ARR: $850K (Up from $120K 12 months ago).", fontsize=11)
    y += 15
    page.insert_text((50, y), "- CAC: $4,200 | LTV: $58,000 (13.8x LTV/CAC Ratio).", fontsize=11)
    y += 15
    page.insert_text((50, y), "- Net Revenue Retention (NRR): 112%.", fontsize=11)
    y += 15
    page.insert_text((50, y), "- Monthly Churn: 0.8%.", fontsize=11)

    y += 40
    page.insert_text((50, y), "4. The Ask", fontsize=14)
    y += 20
    page.insert_text((50, y), "- Raising $3M Seed Round to expand Engineering and Sales.", fontsize=11)
    y += 15
    page.insert_text((50, y), "- Goal: Reach $2.5M ARR in 14 months.", fontsize=11)

    output_path = os.path.abspath("velocity_crm_deck.pdf")
    doc.save(output_path)
    doc.close()
    print(f"PDF_CREATED:{output_path}")

if __name__ == "__main__":
    create_saas_deck()
