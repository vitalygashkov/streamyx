import { StreamyxCore } from '@streamyx/core';

export const douyuin = () => (core: StreamyxCore) => {
  return {
    name: 'douyuin',
    fetchMediaInfo: async (url: string) => {
      // https://www.iesdouyin.com/share/video/7401495391327358218/?region=RU&mid=7390336987405781769&u_code=0&did=MS4wLjABAAAANwpln6KQbVK0g2ahfWCV_6mfWbhLg-9B7VGWMdZ3jddlu6pNdWazoSA8EHYIPFkd&iid=MS4wLjABAAAANwkJuWIRFOzg5uCpDRpMj4OX-QryoDgn-yYlXQnRwQQ&with_sec_did=1&titleType=title&share_sign=IZn6MJcKUfrlx9W32feRHNifmQAZ2yRmeHFFyVlcen0-&share_version=170400&ts=1723361208&from_aid=6383&from_ssr=1
      // https://www.iesdouyin.com/web/api/v2/aweme/iteminfo/?reflow_source=reflow_page&web_id=7401780446730946098&device_id=7401780446730946098&aid=6383&item_ids=7401495391327358218&reflow_id=Q5t%2Fo5Ahd4EXUS2ZLWza1LRksfgR1%2F62hzU9C0hDecDTrEZIPpsELot3MTCmIXOnn4pGVPGgYK9pJbPNwHC8JuMWyzOSwfRYQciZB9%2BnlK8xb1PhHATtgDhMIKfWNCdspib5seHqODao1demaacL%2FA%3D%3D&a_bogus=OJmMMVuDDDIkXfDv5WVLfY3q3vp3YZRw0b1vMD2LKnvJp639HMOr9exo7j7vJ3mjN4%2FkIbWjy4htYrPMx5InA3hVHmJPU9rBmDSkKl5Q5xSb5qfetLfQE0vE-hsISMn2-v1-rOfkqXMHFmG0kNPEhfl4Chhm
      // https://www.iesdouyin.com/aweme/v1/playwm/?video_id=v0d00fg10000cqrm90fog65p4fum73og&ratio=720p&line=0
    },
  };
};
