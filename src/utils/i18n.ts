import { Language } from '../types/card';

export interface CopyBundle {
  brand: string;
  editCard: string;
  doneEditing: string;
  customerView: string;
  studioView: string;
  saveContact: string;
  savingContact: string;
  whatsappNow: string;
  contactSavedHint: string;
  callNow: string;
  sendEmail: string;
  qrCode: string;
  shareCard: string;
  copied: string;
  copy: string;
  phoneLabel: string;
  emailLabel: string;
  companyLabel: string;
  websiteLabel: string;
  locationLabel: string;
  editorTitle: string;
  editorSubtitle: string;
  avatarLabel: string;
  uploadPhoto: string;
  resetPhoto: string;
  fullNameLabel: string;
  titleLabel: string;
  companyNameLabel: string;
  bioLabel: string;
  themeLabel: string;
  themes: {
    porcelain: string;
    obsidian: string;
    spruce: string;
  };
  generateNewCard: string;
  generatingCard: string;
  generatedSuccess: string;
  generatedListTitle: string;
  generatedListEmpty: string;
  copyLink: string;
  linkCopied: string;
  openCustomerLink: string;
  loadIntoEditor: string;
  deleteCard: string;
  newBlankDraft: string;
  resetDefaults: string;
  qrModalTitle: string;
  qrTabVcard: string;
  qrTabLink: string;
  qrVcardHint: string;
  qrLinkHint: string;
  downloadQr: string;
  close: string;
  optionalSection: string;
  cardNotFoundTitle: string;
  cardNotFoundDesc: string;
  backToStudio: string;
}

export const COPY: Record<Language, CopyBundle> = {
  zh: {
    brand: 'E-Business Name Card',
    editCard: '后台编制',
    doneEditing: '完成',
    customerView: '顾客视角',
    studioView: '后台编制模式',
    saveContact: 'Save Contact',
    savingContact: '生成中...',
    whatsappNow: 'WhatsApp Now',
    contactSavedHint: '已生成 .vcf 通讯录文件，请在弹窗中选择“添加到通讯录”',
    callNow: '拨打电话',
    sendEmail: '发送邮件',
    qrCode: '二维码',
    shareCard: '分享名片',
    copied: '已复制',
    copy: '复制',
    phoneLabel: '联系电话',
    emailLabel: '电子邮箱',
    companyLabel: '公司与职位',
    websiteLabel: '官方网站',
    locationLabel: '所在城市',
    editorTitle: '后台名片编制模式',
    editorSubtitle: '填写或修改资料后，点击下方“生成全新名片链接”，每次都会生成一条独立的顾客视角链接。',
    avatarLabel: '个人头像',
    uploadPhoto: '更换头像照片',
    resetPhoto: '恢复默认头像',
    fullNameLabel: '姓名 (Name)',
    titleLabel: '职位头衔 (Title)',
    companyNameLabel: '公司名称 (Company)',
    bioLabel: '个人简介 (可选)',
    themeLabel: '名片质感风格',
    themes: {
      porcelain: '素瓷白',
      obsidian: '曜石黑',
      spruce: '松石绿',
    },
    generateNewCard: '生成全新名片链接',
    generatingCard: '正在生成链接...',
    generatedSuccess: '已生成全新独立链接，可直接复制发给顾客',
    generatedListTitle: '已生成的顾客名片链接',
    generatedListEmpty: '还没有生成独立名片链接，填写资料后点击“生成全新名片链接”即可无限创建。',
    copyLink: '复制链接',
    linkCopied: '已复制',
    openCustomerLink: '顾客视角预览',
    loadIntoEditor: '载入编辑',
    deleteCard: '删除',
    newBlankDraft: '清空重填',
    resetDefaults: '填入示例',
    qrModalTitle: '扫码名片',
    qrTabVcard: '扫码存通讯录',
    qrTabLink: '扫码打开网页名片',
    qrVcardHint: '顾客用手机相机扫码，即可直接弹出“添加到通讯录”提示。',
    qrLinkHint: '顾客扫码后可在手机浏览器打开您的完整互动电子名片。',
    downloadQr: '保存二维码图片',
    close: '关闭',
    optionalSection: '补充信息 (可选)',
    cardNotFoundTitle: '未找到该电子名片',
    cardNotFoundDesc: '该名片链接可能已被删除或地址不完整。',
    backToStudio: '返回后台编制模式',
  },
  en: {
    brand: 'E-Business Name Card',
    editCard: 'Builder',
    doneEditing: 'Done',
    customerView: 'Customer View',
    studioView: 'Builder Studio',
    saveContact: 'Save Contact',
    savingContact: 'Preparing...',
    whatsappNow: 'WhatsApp Now',
    contactSavedHint: 'Contact card (.vcf) ready — tap to add to your phone Contacts.',
    callNow: 'Call',
    sendEmail: 'Email',
    qrCode: 'QR Code',
    shareCard: 'Share',
    copied: 'Copied',
    copy: 'Copy',
    phoneLabel: 'Phone',
    emailLabel: 'Email Address',
    companyLabel: 'Company & Title',
    websiteLabel: 'Website',
    locationLabel: 'Location',
    editorTitle: 'E-Card Builder Studio',
    editorSubtitle: 'Fill in card details and click Generate New Card Link to mint a fresh unique URL for each person.',
    avatarLabel: 'Profile Photo',
    uploadPhoto: 'Upload Photo',
    resetPhoto: 'Reset Default',
    fullNameLabel: 'Full Name',
    titleLabel: 'Job Title',
    companyNameLabel: 'Company Name',
    bioLabel: 'Short Bio (Optional)',
    themeLabel: 'Card Finish',
    themes: {
      porcelain: 'Porcelain',
      obsidian: 'Obsidian',
      spruce: 'Spruce',
    },
    generateNewCard: 'Generate New Card Link',
    generatingCard: 'Generating...',
    generatedSuccess: 'New unique link created and ready to copy.',
    generatedListTitle: 'Generated Customer Card Links',
    generatedListEmpty: 'No generated card links yet. Click Generate New Card Link above to create unlimited cards.',
    copyLink: 'Copy Link',
    linkCopied: 'Copied',
    openCustomerLink: 'Open Customer View',
    loadIntoEditor: 'Load to Editor',
    deleteCard: 'Delete',
    newBlankDraft: 'Clear Draft',
    resetDefaults: 'Load Sample',
    qrModalTitle: 'Scan Business Card',
    qrTabVcard: 'Direct Save Contact',
    qrTabLink: 'Open Web Card',
    qrVcardHint: 'Point any phone camera to save phone, email, and company directly into Contacts.',
    qrLinkHint: 'Scan to open this mobile E-Business Card in the browser.',
    downloadQr: 'Download QR PNG',
    close: 'Close',
    optionalSection: 'Optional Details',
    cardNotFoundTitle: 'Business Card Not Found',
    cardNotFoundDesc: 'This card link may have been removed or the URL is incomplete.',
    backToStudio: 'Back to Builder Studio',
  },
};
