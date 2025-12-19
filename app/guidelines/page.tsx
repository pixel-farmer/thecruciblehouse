'use client';

import { motion } from 'framer-motion';
import ScrollAnimation from '../components/ScrollAnimation';

export default function GuidelinesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section style={{ paddingTop: '120px', paddingBottom: '80px', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <ScrollAnimation>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h1 style={{ 
                fontSize: '3rem', 
                fontWeight: 600, 
                marginBottom: '2rem',
                fontFamily: 'var(--font-playfair)',
                color: 'var(--primary-color)'
              }}>
                Community Guidelines
              </h1>
            </div>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <strong style={{
                fontSize: '1.2rem',
                color: 'var(--primary-color)',
                fontFamily: 'var(--font-playfair)',
                display: 'block',
                marginBottom: '8px',
                textAlign: 'left'
              }}>
                Welcome to The Crucible House!
              </strong>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.8',
                color: 'var(--text-light)',
                marginBottom: '25px',
                textAlign: 'left'
              }}>
                We're a supportive community of artists dedicated to sharing work, giving constructive feedback, and helping each other grow. To keep this space safe, inspiring, and welcoming for everyone, please follow these simple guidelines:
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '40px 0',
                textAlign: 'left'
              }}>
                <li style={{
                  marginBottom: '30px',
                  paddingLeft: '30px',
                  position: 'relative'
                }}>
                  <strong style={{
                    fontSize: '1.2rem',
                    color: 'var(--primary-color)',
                    fontFamily: 'var(--font-playfair)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Respect All Members
                  </strong>
                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-light)',
                    margin: 0
                  }}>
                    Be kind, constructive, and professional. Criticism should always be helpful—focus on the art, not the person. No harassment, hate speech, discrimination, threats, or personal attacks of any kind.
                  </p>
                </li>
                <li style={{
                  marginBottom: '30px',
                  paddingLeft: '30px',
                  position: 'relative'
                }}>
                  <strong style={{
                    fontSize: '1.2rem',
                    color: 'var(--primary-color)',
                    fontFamily: 'var(--font-playfair)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Keep Content Appropriate
                  </strong>
                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-light)',
                    margin: 0
                  }}>
                    Artistic nudity and mature themes are allowed when clearly tagged as "Mature." Explicit sexual content, extreme violence, gore, hate symbols, or illegal material is strictly prohibited.
                  </p>
                </li>
                <li style={{
                  marginBottom: '30px',
                  paddingLeft: '30px',
                  position: 'relative'
                }}>
                  <strong style={{
                    fontSize: '1.2rem',
                    color: 'var(--primary-color)',
                    fontFamily: 'var(--font-playfair)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Original Work Only
                  </strong>
                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-light)',
                    margin: 0
                  }}>
                    Upload only artwork you created or have clear permission to share. No plagiarism, tracing without credit, or AI-generated art passed off as fully human-made.
                  </p>
                </li>
                <li style={{
                  marginBottom: '30px',
                  paddingLeft: '30px',
                  position: 'relative'
                }}>
                  <strong style={{
                    fontSize: '1.2rem',
                    color: 'var(--primary-color)',
                    fontFamily: 'var(--font-playfair)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    No Spam or Self-Promotion Overload
                  </strong>
                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-light)',
                    margin: 0
                  }}>
                    Share your work and links thoughtfully. Excessive self-promotion, unsolicited advertising, or off-topic posts will be removed.
                  </p>
                </li>
                <li style={{
                  marginBottom: '30px',
                  paddingLeft: '30px',
                  position: 'relative'
                }}>
                  <strong style={{
                    fontSize: '1.2rem',
                    color: 'var(--primary-color)',
                    fontFamily: 'var(--font-playfair)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Protect Privacy
                  </strong>
                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-light)',
                    margin: 0
                  }}>
                    Don't share personal information about others without consent. Respect requests to remove tags or mentions.
                  </p>
                </li>
                <li style={{
                  marginBottom: '30px',
                  paddingLeft: '30px',
                  position: 'relative'
                }}>
                  <strong style={{
                    fontSize: '1.2rem',
                    color: 'var(--primary-color)',
                    fontFamily: 'var(--font-playfair)',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    Follow the Law
                  </strong>
                  <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.8',
                    color: 'var(--text-light)',
                    margin: 0
                  }}>
                    No content that violates copyright, trademark, or any applicable laws.
                  </p>
                </li>
              </ul>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.8',
                color: 'var(--text-light)',
                marginBottom: '25px',
                marginTop: '40px',
                textAlign: 'left'
              }}>
                Violations may result in content removal, warnings, or account suspension/ban at the moderators' discretion. We're a small team doing our best to keep the community positive—your help in reporting issues is greatly appreciated.
              </p>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.8',
                color: 'var(--text-light)',
                marginBottom: '25px',
                textAlign: 'left'
              }}>
                By joining The Crucible House, you agree to these guidelines and to treating fellow artists with the respect you'd like to receive.
              </p>
              <p style={{
                fontSize: '1.1rem',
                lineHeight: '1.8',
                color: 'var(--text-light)',
                marginBottom: '25px',
                textAlign: 'left'
              }}>
                Thank you for helping us build an amazing creative home!
              </p>
            </div>
          </ScrollAnimation>
        </div>
      </section>
    </motion.div>
  );
}
