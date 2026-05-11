export interface TaxonomyEntry {
  value: string;
  label: string;
  description: string;
}

export interface TaxonomyCategory {
  value: string;
  label: string;
  description: string;
  entries: TaxonomyEntry[];
}

export const ENISA_RSIT_TAXONOMY: TaxonomyCategory[] = [
  {
    value: 'abusive-content',
    label: 'Abusive Content',
    description:
      'Content that is illegal or actionable under applicable legislation.',
    entries: [
      {
        value: 'spam',
        label: 'Spam',
        description:
          'Unsolicited bulk messages sent for commercial or malicious purposes.',
      },
      {
        value: 'harmful-speech',
        label: 'Harmful Speech',
        description:
          'Hate speech, discrimination, or threats directed at individuals or groups.',
      },
      {
        value: 'child-abuse-material',
        label: 'Child Abuse Material',
        description:
          'Content depicting the sexual exploitation or abuse of children.',
      },
    ],
  },
  {
    value: 'malicious-code',
    label: 'Malicious Code',
    description:
      'Software intentionally designed to cause damage or gain unauthorised access.',
    entries: [
      {
        value: 'virus',
        label: 'Virus',
        description:
          'Self-replicating malware that attaches to legitimate programs or files.',
      },
      {
        value: 'worm',
        label: 'Worm',
        description:
          'Self-propagating malware that spreads across networks without user interaction.',
      },
      {
        value: 'trojan',
        label: 'Trojan',
        description:
          'Malware disguised as legitimate software to trick users into execution.',
      },
      {
        value: 'spyware',
        label: 'Spyware',
        description:
          'Software that covertly collects user information without consent.',
      },
      {
        value: 'ransomware',
        label: 'Ransomware',
        description:
          'Malware that encrypts data and demands payment for its release.',
      },
      {
        value: 'rootkit',
        label: 'Rootkit',
        description:
          'Software designed to hide the existence of malicious processes or programs.',
      },
      {
        value: 'dialer',
        label: 'Dialer',
        description:
          'Malware that connects a system to premium-rate telephone numbers.',
      },
      {
        value: 'cryptominer',
        label: 'Cryptominer',
        description:
          'Malware that uses system resources to mine cryptocurrency without authorisation.',
      },
    ],
  },
  {
    value: 'information-gathering',
    label: 'Information Gathering',
    description:
      'Activities aimed at collecting information about targets for later exploitation.',
    entries: [
      {
        value: 'scanning',
        label: 'Scanning',
        description:
          'Active probing of networks or systems to discover services and vulnerabilities.',
      },
      {
        value: 'sniffing',
        label: 'Sniffing',
        description:
          'Passive interception of network traffic to capture sensitive data.',
      },
      {
        value: 'social-engineering',
        label: 'Social Engineering',
        description:
          'Manipulation of individuals to divulge confidential information or perform actions.',
      },
      {
        value: 'phishing',
        label: 'Phishing',
        description:
          'Fraudulent attempts to obtain credentials by impersonating a trustworthy entity.',
      },
    ],
  },
  {
    value: 'intrusion-attempts',
    label: 'Intrusion Attempts',
    description:
      'Attempts to exploit vulnerabilities or bypass security controls to gain access.',
    entries: [
      {
        value: 'exploitation-of-vulnerability',
        label: 'Exploitation of Vulnerability',
        description:
          'Attempt to exploit a known software or hardware vulnerability.',
      },
      {
        value: 'login-attempts',
        label: 'Login Attempts',
        description:
          'Brute-force or credential-stuffing attacks against authentication mechanisms.',
      },
      {
        value: 'new-attack-signature',
        label: 'New Attack Signature',
        description:
          'Previously unknown attack pattern not matching existing signatures.',
      },
    ],
  },
  {
    value: 'intrusions',
    label: 'Intrusions',
    description:
      'Successful unauthorised access to systems, accounts, or applications.',
    entries: [
      {
        value: 'compromised-account',
        label: 'Compromised Account',
        description:
          'Unauthorised access gained to a user or service account.',
      },
      {
        value: 'compromised-application',
        label: 'Compromised Application',
        description:
          'Application integrity breached through exploitation or tampering.',
      },
      {
        value: 'compromised-system',
        label: 'Compromised System',
        description:
          'Full or partial unauthorised control obtained over a system.',
      },
      {
        value: 'bot',
        label: 'Bot',
        description:
          'System compromised and enrolled in a botnet for remote command execution.',
      },
    ],
  },
  {
    value: 'availability',
    label: 'Availability',
    description:
      'Incidents affecting the availability of systems, networks, or services.',
    entries: [
      {
        value: 'dos',
        label: 'Denial of Service',
        description:
          'Attack rendering a service unavailable by overwhelming it with requests.',
      },
      {
        value: 'ddos',
        label: 'Distributed Denial of Service',
        description:
          'Coordinated denial-of-service attack originating from multiple sources.',
      },
      {
        value: 'sabotage',
        label: 'Sabotage',
        description:
          'Deliberate destruction or disruption of infrastructure or services.',
      },
      {
        value: 'outage',
        label: 'Outage',
        description:
          'Unintentional service disruption caused by misconfiguration or failure.',
      },
    ],
  },
  {
    value: 'information-content-security',
    label: 'Information Content Security',
    description:
      'Incidents affecting the confidentiality, integrity, or availability of data.',
    entries: [
      {
        value: 'unauthorised-information-access',
        label: 'Unauthorised Information Access',
        description:
          'Access to information without proper authorisation or clearance.',
      },
      {
        value: 'unauthorised-information-modification',
        label: 'Unauthorised Information Modification',
        description:
          'Alteration of data without proper authorisation or approval.',
      },
      {
        value: 'data-loss',
        label: 'Data Loss',
        description:
          'Permanent loss of data due to accidental deletion or system failure.',
      },
      {
        value: 'data-leak',
        label: 'Data Leak',
        description:
          'Exposure of sensitive information to unauthorised parties.',
      },
    ],
  },
  {
    value: 'fraud',
    label: 'Fraud',
    description:
      'Actions intended to deceive or misuse resources for personal gain.',
    entries: [
      {
        value: 'unauthorised-use-of-resources',
        label: 'Unauthorised Use of Resources',
        description:
          'Use of institutional resources for unauthorised purposes.',
      },
      {
        value: 'copyright',
        label: 'Copyright',
        description:
          'Distribution or use of copyrighted material without authorisation.',
      },
      {
        value: 'masquerade',
        label: 'Masquerade',
        description:
          'Impersonation of another entity to gain an illegitimate advantage.',
      },
      {
        value: 'phishing',
        label: 'Phishing',
        description:
          'Fraudulent attempts to obtain sensitive data by posing as a trusted entity.',
      },
    ],
  },
  {
    value: 'vulnerable',
    label: 'Vulnerable',
    description:
      'Systems or services with exploitable weaknesses or misconfigurations.',
    entries: [
      {
        value: 'weak-crypto',
        label: 'Weak Cryptography',
        description:
          'Use of outdated or insufficient cryptographic algorithms or key lengths.',
      },
      {
        value: 'ddos-amplifier',
        label: 'DDoS Amplifier',
        description:
          'Misconfigured service that can be abused to amplify denial-of-service attacks.',
      },
      {
        value: 'potentially-unwanted-accessible',
        label: 'Potentially Unwanted Accessible',
        description:
          'Service accessible from the internet that should not be publicly exposed.',
      },
      {
        value: 'information-disclosure',
        label: 'Information Disclosure',
        description:
          'System inadvertently exposing sensitive information to unauthenticated users.',
      },
      {
        value: 'vulnerable-system',
        label: 'Vulnerable System',
        description:
          'System running software with known unpatched vulnerabilities.',
      },
    ],
  },
];
