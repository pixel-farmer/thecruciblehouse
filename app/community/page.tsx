'use client';

import { motion } from 'framer-motion';
import ScrollAnimation from '../components/ScrollAnimation';
import styles from '../styles/Community.module.css';

export default function CommunityPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <section className={styles.community} style={{ paddingTop: '120px' }}>
        <div className={styles.container}>
          <ScrollAnimation>
            <h2 className={styles.sectionTitle}>Community</h2>
          </ScrollAnimation>

          <div className={styles.communityGrid}>
            {/* Column 1: Recently Active Members / Groups */}
            <ScrollAnimation>
              <div className={styles.column}>
                <h3 className={styles.columnTitle}>Recently Active Members</h3>
                <div className={styles.memberList}>
                  <div className={styles.memberItem}>
                    <div className={styles.memberAvatar}>JD</div>
                    <div className={styles.memberInfo}>
                      <p className={styles.memberName}>John Doe</p>
                      <p className={styles.memberActivity}>Active 2 hours ago</p>
                    </div>
                  </div>
                  <div className={styles.memberItem}>
                    <div className={styles.memberAvatar}>JS</div>
                    <div className={styles.memberInfo}>
                      <p className={styles.memberName}>Jane Smith</p>
                      <p className={styles.memberActivity}>Active 5 hours ago</p>
                    </div>
                  </div>
                  <div className={styles.memberItem}>
                    <div className={styles.memberAvatar}>AB</div>
                    <div className={styles.memberInfo}>
                      <p className={styles.memberName}>Alex Brown</p>
                      <p className={styles.memberActivity}>Active 1 day ago</p>
                    </div>
                  </div>
                </div>

                <h4 className={styles.subsectionTitle}>Groups</h4>
                <div className={styles.groupList}>
                  <div className={styles.groupItem}>
                    <h5 className={styles.groupName}>Digital Artists Collective</h5>
                    <p className={styles.groupMembers}>245 members</p>
                  </div>
                  <div className={styles.groupItem}>
                    <h5 className={styles.groupName}>Traditional Techniques</h5>
                    <p className={styles.groupMembers}>189 members</p>
                  </div>
                  <div className={styles.groupItem}>
                    <h5 className={styles.groupName}>Business & Marketing</h5>
                    <p className={styles.groupMembers}>312 members</p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>

            {/* Column 2: Blog / Resources */}
            <ScrollAnimation>
              <div className={styles.column}>
                <h3 className={styles.columnTitle}>Blog & Resources</h3>
                <div className={styles.blogList}>
                  <article className={styles.blogItem}>
                    <h4 className={styles.blogTitle}>10 Marketing Strategies for Artists</h4>
                    <p className={styles.blogExcerpt}>
                      Learn how to effectively market your artwork and build your brand in the digital age.
                    </p>
                    <span className={styles.blogDate}>March 15, 2025</span>
                  </article>
                  <article className={styles.blogItem}>
                    <h4 className={styles.blogTitle}>Mastering Color Theory</h4>
                    <p className={styles.blogExcerpt}>
                      A comprehensive guide to understanding and applying color theory in your artwork.
                    </p>
                    <span className={styles.blogDate}>March 10, 2025</span>
                  </article>
                  <article className={styles.blogItem}>
                    <h4 className={styles.blogTitle}>Building Your Art Business</h4>
                    <p className={styles.blogExcerpt}>
                      Essential tips for turning your passion into a sustainable business.
                    </p>
                    <span className={styles.blogDate}>March 5, 2025</span>
                  </article>
                  <article className={styles.blogItem}>
                    <h4 className={styles.blogTitle}>Digital Art Techniques Tutorial</h4>
                    <p className={styles.blogExcerpt}>
                      Step-by-step tutorial on creating stunning digital artwork using modern tools.
                    </p>
                    <span className={styles.blogDate}>February 28, 2025</span>
                  </article>
                </div>
              </div>
            </ScrollAnimation>

            {/* Column 3: Members Near Me / Meetups */}
            <ScrollAnimation>
              <div className={styles.column}>
                <h3 className={styles.columnTitle}>Members Near Me</h3>
                <div className={styles.nearbyList}>
                  <div className={styles.nearbyItem}>
                    <div className={styles.nearbyAvatar}>MC</div>
                    <div className={styles.nearbyInfo}>
                      <p className={styles.nearbyName}>Mike Chen</p>
                      <p className={styles.nearbyDistance}>2.3 miles away</p>
                    </div>
                  </div>
                  <div className={styles.nearbyItem}>
                    <div className={styles.nearbyAvatar}>SL</div>
                    <div className={styles.nearbyInfo}>
                      <p className={styles.nearbyName}>Sarah Lee</p>
                      <p className={styles.nearbyDistance}>4.7 miles away</p>
                    </div>
                  </div>
                  <div className={styles.nearbyItem}>
                    <div className={styles.nearbyAvatar}>RW</div>
                    <div className={styles.nearbyInfo}>
                      <p className={styles.nearbyName}>Robert White</p>
                      <p className={styles.nearbyDistance}>6.1 miles away</p>
                    </div>
                  </div>
                </div>

                <h4 className={styles.subsectionTitle}>Upcoming Events</h4>
                <div className={styles.eventList}>
                  <div className={styles.eventItem}>
                    <h5 className={styles.eventName}>Portrait Workshop</h5>
                    <p className={styles.eventDate}>March 20, 2025</p>
                    <p className={styles.eventLocation}>Studio Downtown</p>
                  </div>
                  <div className={styles.eventItem}>
                    <h5 className={styles.eventName}>Digital Art Meetup</h5>
                    <p className={styles.eventDate}>March 25, 2025</p>
                    <p className={styles.eventLocation}>Community Center</p>
                  </div>
                  <div className={styles.eventItem}>
                    <h5 className={styles.eventName}>Business Networking</h5>
                    <p className={styles.eventDate}>April 1, 2025</p>
                    <p className={styles.eventLocation}>Art Gallery</p>
                  </div>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

