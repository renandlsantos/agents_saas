'use client';

import { Markdown } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { memo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { BRANDING_NAME } from '@/const/branding';
import { isCustomBranding } from '@/const/version';
import { useGreeting } from '@/hooks/useGreeting';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import AddButton from './AddButton';
import QuestionSuggest from './QuestionSuggest';

const useStyles = createStyles(({ css, responsive }) => ({
  container: css`
    align-items: center;
    ${responsive.mobile} {
      align-items: flex-start;
    }
  `,
  desc: css`
    font-size: 14px;
    text-align: center;
    ${responsive.mobile} {
      text-align: start;
    }
  `,
  title: css`
    margin-block: 0.2em 0;
    font-size: 32px;
    font-weight: bolder;
    line-height: 1;
    ${responsive.mobile} {
      font-size: 24px;
    }
  `,
}));

const InboxWelcome = memo(() => {
  const { t } = useTranslation('welcome');
  const { styles } = useStyles();
  const mobile = useServerConfigStore((s) => s.isMobile);
  const greeting = useGreeting();
  const { showWelcomeSuggest, showCreateSession } = useServerConfigStore(featureFlagsSelectors);

  // Remove any emoji from the greeting text
  const cleanGreeting = greeting
    ?.replace(
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      '',
    )
    .trim();

  return (
    <Center padding={16} width={'100%'}>
      <Flexbox className={styles.container} gap={16} style={{ maxWidth: 800 }} width={'100%'}>
        <h1 className={styles.title}>{cleanGreeting}</h1>
        <Markdown
          className={styles.desc}
          customRender={(dom, context) => {
            if (context.text.includes('<plus />')) {
              return (
                <Trans
                  components={{
                    br: <br />,
                    plus: <AddButton />,
                  }}
                  i18nKey="guide.defaultMessage"
                  ns="welcome"
                  values={{ appName: BRANDING_NAME }}
                />
              );
            }
            return dom;
          }}
          variant={'chat'}
        >
          {t(showCreateSession ? 'guide.defaultMessage' : 'guide.defaultMessageWithoutCreate', {
            appName: BRANDING_NAME,
          })}
        </Markdown>
        {showWelcomeSuggest && !isCustomBranding && <QuestionSuggest mobile={mobile} />}
      </Flexbox>
    </Center>
  );
});

export default InboxWelcome;
