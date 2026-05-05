/**
 * @fileoverview ECI-Aligned Hardcoded Fallbacks
 * Used when all AI providers fail to ensure the user always gets accurate guidance.
 */

const fallbacks = {
  get: (prompt) => {
    const lower = prompt.toLowerCase().trim();

    // 1. Greetings & General Help
    const greetings = ['hi', 'hey', 'hello', 'namaste', 'namaskaram', 'hii', 'hiii', 'yo', 'sup', 'hola', 'ok', 'okay', 'thanks', 'thank you', 'haan', 'theek', 'fine', 'good', 'nice', 'cool', 'hmm', 'kya haal', 'kaise ho', 'how are you', 'what\'s up', 'wassup', 'hey there'];
    const isGreeting = greetings.some(g => lower === g || lower.startsWith(g + ' ') || lower.startsWith(g + ',') || lower.startsWith(g + '!'));

    if (isGreeting || lower.length < 15) {
      return `🙏 **Namaste!** Welcome to **CivicGuide AI** — your personal Indian election assistant.

## 🤖 Who Am I?
I am an AI-powered guide built on official **Election Commission of India (ECI)** data to help you navigate the entire voting process — from registration to casting your vote.

## 🛠️ How Can I Help You?
• **Voter Registration** — How to register, Form 6, eligibility check
• **Voter ID Issues** — Lost ID, name mismatch, corrections, duplicates
• **Polling Booth** — Find your booth, what to carry, voting process
• **EVM & VVPAT** — How electronic voting machines work
• **Election Rules** — Model Code of Conduct, voter rights
• **Special Voting** — NRI voting, senior citizens, PwD, postal ballot
• **Complaints** — Report violations via cVIGIL app
• **Hindi / English** — I can answer in both languages! 🇮🇳

## 📞 Quick Info
• **ECI Helpline:** 1950
• **Voter Portal:** https://voters.eci.gov.in/
• **Booth Search:** https://electoralsearch.eci.gov.in/

👉 **Next Step:** Please tell me exactly what election-related help you need! For example: *How do I register to vote?* or *मेरा Voter ID खो गया है*`;
    }

    // 2. Registration / Form 6
    if (lower.includes('register') || lower.includes('voter id') || lower.includes('form 6')) {
      return `## How to Register as a Voter in India

**Step 1:** Visit the official ECI portal: https://voters.eci.gov.in/

**Step 2:** Click on "New Voter Registration" and fill **Form 6**.

**Step 3:** Upload required documents:
• Passport-sized photograph
• Proof of Age (Birth certificate, 10th marksheet, or Aadhaar)
• Proof of Address (Aadhaar, Passport, or utility bill)

**Step 4:** Submit the form and note your reference number for tracking.

👉 **Next Step:** Visit https://voters.eci.gov.in/ and start your registration today!`;
    }

    // 3. Polling Booth
    if (lower.includes('booth') || lower.includes('polling')) {
      return `## How to Find Your Polling Booth

**Step 1:** Visit the official ECI Search portal: https://electoralsearch.eci.gov.in/

**Step 2:** Search using your **EPIC (Voter ID)** number or your personal details.

**Step 3:** Your polling station name and address will be displayed.

**Step 4:** On voting day, carry your **Voter ID Card (EPIC)** or another approved photo ID (Aadhaar, PAN, DL, Passport).

👉 **Next Step:** Search for your polling station today so you know where to go!`;
    }

    // 3.5 Helpline & Support
    if (lower.includes('helpline') || lower.includes('number') || lower.includes('1950')) {
      return `## ECI Voter Helpline
The official Voter Helpline number is **1950**.

You can call this number from anywhere in India for:
• Checking your name in the electoral roll
• Information on voter registration
• Finding your polling station
• Filing complaints

**Other ways to get help:**
• **Website:** https://voters.eci.gov.in/
• **App:** Download the 'Voter Helpline' app from Play Store/App Store.
• **SMS:** Type 'ECIP <space> <EPIC Number>' and send to **1950**.`;
    }

    // 3.6 Election Dates
    if (lower.includes('date') || lower.includes('when') || lower.includes('schedule')) {
      return `## Election Schedule & Dates
Election dates are announced officially by the **Election Commission of India (ECI)**.

**How to check the latest dates:**
1. Visit the **ECI Schedule Page:** https://www.eci.gov.in/elections/term-of-the-houses/
2. Check your local state news for **Phase-wise** voting dates.
3. Use the **Voter Helpline App** to see upcoming elections in your constituency.

👉 **Note:** Dates vary by state and constituency. Always refer to official ECI notifications for the final schedule.`;
    }

    // 4. EVM / VVPAT
    if (lower.includes('evm') || lower.includes('vvpat') || lower.includes('machine')) {
      return `## Understanding EVM & VVPAT

**EVM (Electronic Voting Machine):**
• A standalone, secure device with Ballot Unit (BU) and Control Unit (CU).
• **Not connected to the internet** — fully offline.
• Press the blue button next to your candidate's name to vote.

**VVPAT (Voter Verifiable Paper Audit Trail):**
• A printer attached to the EVM that shows a paper slip of your vote for **7 seconds** before it drops into a sealed box.
• This allows you to verify that your vote was cast correctly.

## Security Features
• One-time programmable chips.
• Tested before every election by candidates' agents.
• Stored in sealed strong rooms under 24/7 CCTV.

👉 **Next Step:** Watch ECI's official EVM demo video on their YouTube channel!`;
    }

    // Default Catch-all
    return `## Your Voting Journey Guide

India's democracy is strengthened by every vote. Here's what you need to know:

• **Step 1:** Check if you're registered at https://voters.eci.gov.in/
• **Step 2:** If not registered, apply using **Form 6** online.
• **Step 3:** Gather your documents (Aadhaar, age proof, address proof).
• **Step 4:** Find your polling booth at https://electoralsearch.eci.gov.in/
• **Step 5:** On election day, visit your booth with your Voter ID.

## 📞 Need Help?
• **ECI Helpline:** 1950
• **Voter Portal:** https://voters.eci.gov.in/

👉 **Next Step:** Start by checking your voter registration status!`;
  },

  getStructured: (type) => {
    if (type === 'journey') {
      return {
        summary: 'Your complete roadmap to becoming an active voter in the Indian democracy.',
        steps: [
          { number: 1, title: 'Check Eligibility', description: 'Must be an Indian citizen and 18+ years old on the qualifying date.', completed: true },
          { number: 2, title: 'Register (Form 6)', description: 'Visit voters.eci.gov.in and fill Form 6 with photo, age, and address proof.', completed: false, resource: 'https://voters.eci.gov.in/', estimatedTime: '15 mins' },
          { number: 3, title: 'Verification', description: 'Booth Level Officer (BLO) will visit your address for document verification.', completed: false, estimatedTime: '1-2 weeks' },
          { number: 4, title: 'EPIC Generation', description: 'Once approved, your Voter ID card is generated and sent via post.', completed: false },
          { number: 5, title: 'Find Booth', description: 'Search your name in the electoral roll to find your polling station.', completed: false, resource: 'https://electoralsearch.eci.gov.in/' },
        ],
        nextAction: 'Visit the ECI portal and start filling Form 6 today.',
      };
    }

    if (type === 'timeline') {
      return {
        events: [
          { date: 'Current Phase', event: 'Voter Registration Open', description: 'You can register anytime before elections are announced.', type: 'registration', icon: 'user-plus' },
          { date: 'Election Week', event: 'Voter Slip Distribution', description: 'Official voter slips are distributed at your doorstep.', type: 'election', icon: 'file-text' },
          { date: 'Voting Day', event: 'Poll Day', description: 'Cast your vote at your designated polling station between 7 AM to 6 PM.', type: 'election', icon: 'check-circle' },
          { date: 'Counting Day', event: 'Result Declaration', description: 'Votes are counted and results are announced officially.', type: 'result', icon: 'award' },
        ],
        metadata: { source: 'ECI General Guidelines', lastUpdated: new Date().toISOString() },
      };
    }

    if (type === 'quiz') {
      return [
        {
          id: 1,
          question: 'What is the minimum age to vote in India?',
          options: ['16', '18', '21', '25'],
          correctAnswer: '18',
          explanation: 'According to the 61st Amendment Act, the voting age was reduced from 21 to 18 in 1988.',
        },
        {
          id: 2,
          question: 'Which form is used for new voter registration?',
          options: ['Form 6', 'Form 7', 'Form 8', 'Form 6A'],
          correctAnswer: 'Form 6',
          explanation: 'Form 6 is for registration of new voters. Form 7 is for objection to inclusion of name.',
        },
        {
          id: 3,
          question: 'What does VVPAT stand for?',
          options: [
            'Voter Verified Paper Audit Trail',
            'Voter Verification Paper Account Track',
            'Voter Validated Paper Audit Trail',
            'Voter Verified Print Audit Trail',
          ],
          correctAnswer: 'Voter Verified Paper Audit Trail',
          explanation: 'VVPAT allows voters to verify that their vote was cast correctly.',
        },
        {
          id: 4,
          question: 'Who appoints the Chief Election Commissioner of India?',
          options: ['Prime Minister', 'Chief Justice', 'President', 'Parliament'],
          correctAnswer: 'President',
          explanation: 'The President of India appoints the CEC and other Election Commissioners.',
        },
        {
          id: 5,
          question: 'Can an NRI vote in Indian elections?',
          options: ['Yes, online', 'Yes, in person', 'No', 'Only through post'],
          correctAnswer: 'Yes, in person',
          explanation: 'NRIs can vote in person at their polling station in India after registering as overseas voters.',
        },
      ];
    }

    return { error: 'No structured fallback available for this type' };
  },
};

module.exports = fallbacks;
