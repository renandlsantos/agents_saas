import { Skeleton } from 'antd';
import { memo } from 'react';
import { Center } from 'react-layout-kit';

const Loading = memo(() => {
  return (
    <Center height={'100%'} width={'100%'}>
      <Skeleton active paragraph={{ rows: 3 }} />
    </Center>
  );
});

Loading.displayName = 'DocumentationLoading';

export default Loading;
