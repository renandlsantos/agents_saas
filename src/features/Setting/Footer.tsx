'use client';

import { PropsWithChildren, memo } from 'react';

const Footer = memo<PropsWithChildren>(() => {
  // GitHub links removed - returning null to hide footer
  return null;

  /* Original footer with GitHub links commented out
  return hideGitHub ? null : (
    <>
      <Flexbox justify={'flex-end'}>
        <Center
          as={'footer'}
          className={styles}
          flex={'none'}
          horizontal
          padding={16}
          width={'100%'}
        >
          <div style={{ textAlign: 'center' }}>
            <Icon icon={MessageSquareHeart} /> {`${t('footer.title')} `}
            <Link
              aria-label={'star'}
              href={GITHUB}
              onClick={(e) => {
                e.preventDefault();
                setOpenStar(true);
              }}
            >
              {t('footer.action.star')}
            </Link>
            {` ${t('footer.and')} `}
            <Link
              aria-label={'feedback'}
              href={GITHUB_ISSUES}
              onClick={(e) => {
                e.preventDefault();
                setOpenFeedback(true);
              }}
            >
              {t('footer.action.feedback')}
            </Link>
            {' !'}
          </div>
        </Center>
      </Flexbox>
      <GuideModal
        cancelText={t('footer.later')}
        cover={<GuideVideo height={269} src={'/videos/star.mp4?v=1'} width={358} />}
        desc={t('footer.star.desc')}
        okText={t('footer.star.action')}
        onCancel={() => setOpenStar(false)}
        onOk={() => {
          if (isOnServerSide) return;
          window.open(GITHUB, '__blank');
        }}
        open={openStar}
        title={t('footer.star.title')}
      />
      <GuideModal
        cancelText={t('footer.later')}
        cover={<GuideVideo height={269} src={'/videos/feedback.mp4?v=1'} width={358} />}
        desc={t('footer.feedback.desc', { appName: BRANDING_NAME })}
        okText={t('footer.feedback.action')}
        onCancel={() => setOpenFeedback(false)}
        onOk={() => {
          if (isOnServerSide) return;
          window.open(GITHUB_ISSUES, '__blank');
        }}
        open={openFeedback}
        title={t('footer.feedback.title')}
      />
    </>
  );
  */
});

Footer.displayName = 'SettingFooter';

export default Footer;
