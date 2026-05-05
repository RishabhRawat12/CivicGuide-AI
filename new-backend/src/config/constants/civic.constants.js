/**
 * @fileoverview Voter Education Constants
 */

const DEFAULT_CHECKLIST_ITEMS = [
  { key: 'check_eligibility', label: 'Check Voter Eligibility', description: 'Verify age and citizenship requirements.' },
  { key: 'register', label: 'Register as a Voter', description: 'Apply via Form 6 on NVSP portal.' },
  { key: 'get_voter_id', label: 'Get Voter ID Card (EPIC)', description: 'Receive or download your EPIC card.' },
  { key: 'verify_details', label: 'Verify Details in Voter List', description: 'Check your details in the electoral roll.' },
  { key: 'find_booth', label: 'Find Your Polling Booth', description: 'Locate your assigned station.' },
  { key: 'prepare_documents', label: 'Prepare Documents', description: 'Keep Voter ID and one photo ID ready.' },
  { key: 'vote', label: 'Cast Your Vote', description: 'Visit your booth on election day.' },
];

const BOOTH_GUIDE = {
  howToFind: {
    steps: [
      'Visit https://electoralsearch.eci.gov.in/',
      'Enter your EPIC number or search by name',
      'Your polling station details will be displayed',
      'Note down the booth address and number',
      'Visit the location a day before to familiarize yourself',
    ],
    officialLink: 'https://electoralsearch.eci.gov.in/',
  },
  boothProcess: [
    { step: 1, description: 'Join the queue at your assigned booth' },
    { step: 2, description: 'Show your Voter ID to the polling officer' },
    { step: 3, description: 'Your name is verified in the voter list' },
    { step: 4, description: 'Indelible ink is applied on your left index finger' },
    { step: 5, description: 'Enter the voting compartment' },
    { step: 6, description: 'Press the button next to your chosen candidate on the EVM' },
    { step: 7, description: 'Check the VVPAT slip to verify your vote' },
    { step: 8, description: 'Exit the booth' },
  ],
  whatToCarry: ['Voter ID Card (EPIC)', 'Additional Photo ID (Aadhaar/PAN/DL/Passport)', 'Voter slip (if received)'],
  dos: ['Arrive early to avoid long queues', 'Check your name in the voter list beforehand', 'Follow instructions of polling officers', 'Maintain social distancing'],
  donts: ['Do NOT carry mobile phones inside the booth', 'Do NOT take photos of the ballot/EVM', 'Do NOT reveal your vote to anyone', 'Do NOT wear party symbols or colors'],
  timing: '7:00 AM to 6:00 PM (varies by state and constituency)',
  nextAction: 'Search for your polling booth at electoralsearch.eci.gov.in',
};

module.exports = {
  DEFAULT_CHECKLIST_ITEMS,
  BOOTH_GUIDE,
};
