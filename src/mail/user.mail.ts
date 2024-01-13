import mjml from 'mjml'

import { transporter } from '../configs'

export const sendActivateMail = (mailDetails: object): void => {
  void transporter
    .sendMail({
      ...mailDetails,
      html: mjml((mailDetails as any).html).html
    })
    .catch(err => {
      console.log(err)
    })
}
