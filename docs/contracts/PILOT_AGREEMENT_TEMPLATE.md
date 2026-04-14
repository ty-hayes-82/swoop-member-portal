# Swoop — Cloud Service Agreement Cover Page

**Founding Member Pilot Edition**

This Cover Page incorporates by reference the [Common Paper Cloud Service Agreement 2.0 Standard Terms](https://commonpaper.com/standards/cloud-service-agreement/) ("Standard Terms"), a free, standard SaaS contract created by a committee of technology-vendor and customer-side attorneys and licensed under CC BY 4.0. The Customer confirms that they have access to the Standard Terms at the URL above. Together, this Cover Page and the Standard Terms form the entire agreement between the parties.

Capitalized terms not defined on this Cover Page have the meanings given in the Standard Terms.

---

## 1. Parties

**Provider:** Swoop Golf, Inc. *(or your legal entity)*
Address: *[founder address]*
Signatory: *[founder name]*, *[title]*
Email: *[founder email]*

**Customer:** _____________________________________________
Address: _____________________________________________
Signatory: _____________________________________________, _____________________________________________
Email: _____________________________________________

---

## 2. Effective Date

This agreement is effective on the date both parties sign below (the "Effective Date").

---

## 3. Cloud Service

**Name:** Swoop — GM Intelligence Platform

**Description:** A hosted software-as-a-service platform that accepts Customer's uploaded CSV exports from Customer's existing club management systems (including but not limited to Jonas Club Software, Clubessential, ForeTees, Northstar, foreUP, Lightspeed Golf, and 7Shifts), computes cross-domain member intelligence (including health scores, tier revenue analysis, AR aging, F&B settlement mix, and household composition), and produces AI-generated recommendations via the Anthropic Claude API surfaced to Customer's General Manager and approved staff through a web interface.

**Scope:** One (1) club location. Unlimited GM and staff user seats. Unlimited CSV imports. Unlimited AI agent invocations during the Subscription Period.

---

## 4. Subscription Period

**Initial Term:** Twenty-four (24) months, commencing on the Effective Date.

**Pilot Period:** The first ninety (90) days of the Initial Term are a no-cost pilot. Fees begin accruing on **day 91**.

**Renewal:** At the end of the Initial Term, this agreement automatically renews for successive one-month terms unless either party provides written notice of non-renewal at least thirty (30) days before the end of the then-current term.

---

## 5. Fees

### 5.1 Pilot Period (days 0–90): **$0.00**

No credit card or prepayment required. Customer may cancel at any time during the Pilot Period for any reason or no reason by replying to Provider's email. Upon cancellation during the Pilot Period, Provider will export all Customer Data in CSV or JSON format within twenty-four (24) hours of the request and delete Customer Data from Provider systems within seven (7) days.

### 5.2 Founding Member Rate: **$750 USD per month**, locked for twenty-four (24) months from the Effective Date

Billing begins day 91. Invoiced monthly in advance. Net 30 payment terms. First invoice issued on day 91; covers days 91–120.

### 5.3 Post-Initial-Term Pricing

After the 24-month Initial Term, if Customer does not provide notice of non-renewal, monthly fees automatically transition to Provider's then-current Core pricing. Provider will notify Customer in writing at least sixty (60) days before the end of the Initial Term with the new rate. Customer may cancel at any point during or after that notice period without penalty.

### 5.4 No per-member, per-seat, or module-based fees

The Founding Member rate includes all features of the Swoop platform, unlimited seats, and unlimited agent invocations for one (1) club location. Provider may not add fees during the Initial Term for additional members, seats, modules, or features.

---

## 6. Payment

- **Currency:** USD
- **Method:** ACH, wire transfer, or credit card via Stripe invoice link
- **Terms:** Net 30 from invoice date
- **Late fees:** None during the Initial Term. After the Initial Term, standard 1.5% monthly late fee applies per Section 3 of the Standard Terms.

---

## 7. Customer Data

- Customer retains all rights to Customer Data, including all CSV files uploaded and all downstream insights and agent recommendations derived from Customer Data.
- Provider will use Customer Data solely to provide the Cloud Service to Customer.
- Provider will not use Customer Data to train general-purpose AI models. Provider's use of the Anthropic Claude API is governed by Anthropic's data usage policy, which Customer acknowledges.
- Customer may request full data export at any time in CSV or JSON format. Provider will deliver within twenty-four (24) hours for exports under 10 GB.
- Upon termination, Customer Data will be deleted from Provider systems within thirty (30) days unless Customer requests earlier deletion.

---

## 8. Data Location and Security

- **Storage:** Customer Data is stored in Neon Postgres (US-East region) and hosted on Vercel (US regions).
- **Encryption:** Data is encrypted in transit (TLS 1.2+) and at rest.
- **Backups:** Neon performs continuous point-in-time backups with seven-day retention.
- **Access:** Provider personnel access is limited to the founder and engineering contractors under NDA, logged per Provider's internal audit log.
- **Incident Response:** Provider will notify Customer within seventy-two (72) hours of discovering any security incident affecting Customer Data.

---

## 9. Service Level

- **Target uptime:** 99% monthly uptime during the Subscription Period, excluding scheduled maintenance announced at least 24 hours in advance.
- **No uptime credits during the Pilot Period.** After day 91, if monthly uptime falls below 99%, Customer receives a pro-rated credit on the next invoice equal to 1× the downtime percentage.
- **Support:** Email support to *[support email]* with best-effort 48-hour response time during US business hours.

---

## 10. Term and Termination

### 10.1 Termination for convenience

Either party may terminate this agreement for any reason or no reason:

- **During the Pilot Period:** effective immediately upon written notice.
- **After day 91 and during the Initial Term:** effective at the end of the then-current monthly billing period. Customer's card is not charged after termination is received. No refunds on partial months.
- **After the Initial Term:** effective at the end of the then-current monthly billing period.

### 10.2 Termination for cause

Either party may terminate this agreement immediately if the other party materially breaches the agreement and fails to cure the breach within thirty (30) days of written notice.

### 10.3 Post-termination

- Provider will export Customer Data within twenty-four (24) hours of the termination date upon Customer's request.
- Provider will delete all Customer Data within thirty (30) days of termination.
- Customer will pay any outstanding invoiced fees within thirty (30) days of termination.

---

## 11. Limitations of Liability

Per Section 8 of the Standard Terms, each party's aggregate liability under this agreement is capped at the fees paid or payable by Customer in the twelve (12) months preceding the event giving rise to liability. For the Pilot Period, this cap is $0. After day 91, this cap is twelve (12) × $750 = $9,000.

Neither party is liable for indirect, incidental, consequential, or punitive damages.

---

## 12. Governing Law

This agreement is governed by the laws of the State of **[Delaware]** (or your state of incorporation), without regard to conflict-of-law principles. Any dispute not resolved through good-faith negotiation within thirty (30) days will be resolved by binding arbitration under the rules of the American Arbitration Association in **[Wilmington, DE]** (or your city).

---

## 13. Logo Rights (Founding Member only)

Customer grants Provider a limited, revocable license to use Customer's name and logo in Provider's marketing materials (website, decks, case studies) solely to identify Customer as an early Swoop customer. Customer may revoke this license at any time upon written request; Provider will remove Customer's name and logo within thirty (30) days of such request.

---

## 14. Signatures

Both parties acknowledge they have read the [Common Paper Cloud Service Agreement 2.0 Standard Terms](https://commonpaper.com/standards/cloud-service-agreement/) and agree to be bound by them in conjunction with this Cover Page.

---

**Provider: Swoop Golf, Inc.**

Signature: _____________________________________________
Name: _____________________________________________
Title: _____________________________________________
Date: _____________________________________________

---

**Customer:** *[Club Legal Name]*

Signature: _____________________________________________
Name: _____________________________________________
Title: _____________________________________________
Date: _____________________________________________

---

## Appendix A — Fee Summary (for the GM's one-glance read)

| Period | Monthly Fee | Notes |
|---|---|---|
| Days 0–90 (Pilot) | **$0** | Cancel anytime, no credit card required |
| Days 91 through month 24 | **$750/month** | Founding Member rate, locked |
| Month 25+ | Then-current Core rate | Customer notified 60 days in advance, may cancel without penalty |

**Maximum 24-month commitment:** $750 × 21 months (months 4–24) = **$15,750 total**

**Cancel anytime.** Data export on 24-hour request. No modules, no seat fees, no hidden costs.

---

*This Cover Page is based on the [Common Paper Cloud Service Agreement 2.0 Cover Page template](https://commonpaper.com/standards/cloud-service-agreement/), adapted for Swoop's Founding Member pilot program. The underlying Standard Terms are maintained by Common Paper and available at the URL above under a Creative Commons Attribution 4.0 license.*
