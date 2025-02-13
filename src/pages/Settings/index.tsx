import CustomPageTitle from 'components/@ui/CustomPageTitle'

import AlertDashboard from './AlertDashboard'
import Layout from './Layouts/Layout'
import UserSubscription from './UserSubscription'

export default function SettingsPage() {
  return (
    <>
      <CustomPageTitle title="Settings" />
      <Layout userSubscription={<UserSubscription />} botAlert={<AlertDashboard />} />
    </>
  )
}
