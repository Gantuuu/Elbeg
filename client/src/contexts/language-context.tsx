import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 지원 언어 타입
export type Language = 'mn' | 'ru' | 'en';

// 언어 정보 인터페이스
export interface LanguageInfo {
  code: Language;
  name: string;
  flag: string;
}

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'mn', name: 'Монгол', flag: '🇲🇳' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

// 번역 타입
export interface Translations {
  // 공통
  home: string;
  products: string;
  contact: string;
  cart: string;
  profile: string;
  logout: string;
  menu: string;
  siteTitle: string;

  // 홈페이지
  heroTitle: string;
  heroSubtitle: string;
  featuredProducts: string;
  featuredProductsDesc: string;
  categories: {
    all: string;
    beef: string;
    lamb: string;
    chicken: string;
    pork: string;
    other: string;
    swipeHint: string;
  };

  // 배송
  delivery: {
    scrolling: string;
  };

  // 상품
  addToCart: string;
  price: string;
  stock: string;
  outOfStock: string;
  selectQuantity: string;
  quantity: string;
  packageUnit: string;
  minOrderQuantity: string;
  currentOrderTotal: string;
  quantityModalDesc: string;

  // 장바구니
  cartEmpty: string;
  cartEmptyDesc: string;
  viewProducts: string;
  cartItems: string;
  orderInfo: string;
  productTypes: string;
  totalQuantity: string;
  pieces: string;
  shippingFee: string;
  totalAmount: string;
  placeOrder: string;
  continueShopping: string;
  checkout: string;

  // 체크아웃 페이지
  bankTransfer: string;
  bankTransferDesc: string;
  selectBank: string;
  defaultAccount: string;
  copyAccountNumber: string;
  bankInfoNotFound: string;
  transferSenderName: string;
  transferSenderNamePlaceholder: string;
  transferSenderNameDesc: string;
  processingPayment: string;

  // 장바구니 아이템
  total: string;
  remove: string;
  decrease: string;
  increase: string;

  // 푸터
  adminLogin: string;
  copyright: string;
  visitPage: string;

  // 마이페이지
  myPage: string;
  userInfo: string;
  userInfoDesc: string;
  orderHistory: string;
  orderHistoryDesc: string;
  name: string;
  phone: string;
  email: string;
  noOrders: string;
  noOrdersDesc: string;
  orderedProducts: string;
  deliveryInfo: string;
  paymentInfo: string;
  recipient: string;
  address: string;
  paymentStatus: string;
  orderNumber: string;
  totalItems: string;
  orderDate: string;
  showMore: string;
  showDetails: string;
  collapse: string;

  // 주문 상태
  orderStatus: {
    pending: string;
    processing: string;
    completed: string;
    cancelled: string;
  };
  bank: string;
  accountHolder: string;
  accountNumber: string;
  loadingBankInfo: string;
  loadingOrderHistory: string;
  retry: string;

  // 인증
  usernameOrEmail: string;
  password: string;
  confirmPassword: string;
  username: string;
  signup: string;
  signUp: string;
  signIn: string;
  login: string;
  register: string;
  loggingIn: string;
  signingIn: string;
  signingUp: string;
  alreadyHaveAccount: string;
  noAccount: string;
  phoneFormat: string;
  phoneHint: string;
  authHeroTitle: string;
  authHeroDesc: string;
  directDelivery: string;
  viewOrderHistory: string;
  fastPayment: string;
  or: string;
  orContinueWith: string;
  continueWithGoogle: string;

  // 기타
  loading: string;
  error: string;
  success: string;

  // 토스트 메시지
  toast: {
    success: string;
    error: string;
    cartAdded: string;
    cartAddedDesc: string;
    loginRequired: string;
    loginRequiredDesc: string;
    addToCartError: string;
    addToCartErrorDesc: string;
    loginSuccess: string;
    loginSuccessDesc: string;
    loginSuccessWelcome: string;
    loginFailed: string;
    loginFailedDesc: string;
    registerSuccess: string;
    registerSuccessDesc: string;
    registerFailed: string;
    registerFailedDesc: string;
    logoutSuccess: string;
    logoutSuccessDesc: string;
    logoutFailed: string;
    logoutFailedDesc: string;
  };

  // 폼 검증 메시지
  formErrors: {
    required: string;
    invalidEmail: string;
    passwordMismatch: string;
    minLength: string;
    maxLength: string;
    invalidPhone: string;
    usernameExists: string;
    emailExists: string;
  };

  // 모바일 네비게이션
  mobileNav: {
    home: string;
    cart: string;
    profile: string;
  };
}

// 번역 데이터
const translations: Record<Language, Translations> = {
  mn: {
    // 공통
    home: 'Нүүр',
    products: 'Бүтээгдэхүүн',
    contact: 'Холбоо барих',
    cart: 'Сагс',
    profile: 'Миний мэдээлэл',
    logout: 'Гарах',
    menu: 'Цэс',
    siteTitle: 'Элбэг мах хүнс',

    // 홈페이지
    heroTitle: 'Элбэг мах хүнс',
    heroSubtitle: 'Амт чанар болон найдвартай үйлчилгээ нэг дор',
    featuredProducts: 'Манай бүтээгдэхүүнүүд',
    featuredProductsDesc: 'Хамгийн амтлаг чанартайг та бүхэндээ',
    categories: {
      all: 'Бүгд',
      beef: 'Үхрийн мах',
      lamb: 'Хонины мах',
      chicken: 'Тахианы мах',
      pork: 'Гахайн мах',
      other: 'Бусад',
      swipeHint: 'Хажуу тийш гүйлгэж харна уу'
    },

    // 배송
    delivery: {
      scrolling: 'Бүх хот руу хүргэлт үйлчилгээтэй ● Бүх хот руу хүргэлт үйлчилгээтэй ● Бүх хот руу хүргэлт үйлчилгээтэй ● Бүх хот руу хүргэлт үйлчилгээтэй'
    },

    // 상품
    addToCart: 'Сагсанд нэмэх',
    price: 'Үнэ',
    stock: 'Нөөц',
    outOfStock: 'Дууссан',
    selectQuantity: 'Тоо ширхэг сонгох',
    quantity: 'Тоо ширхэг',
    packageUnit: '4кг-ын багцаар',
    minOrderQuantity: 'Хамгийн багадаа {min}кг',
    currentOrderTotal: 'Та одоогоор нийт {total} ₩-ийн захиалга хийсэн байна.',
    quantityModalDesc: 'Бүтээгдэхүүний тоо ширхэг сонгох цонх',

    // 장바구니
    cartEmpty: 'Таны сагс хоосон байна',
    cartEmptyDesc: 'Бүтээгдэхүүн сонгоод "Сагсанд нэмэх" товчийг дарна уу.',
    viewProducts: 'Бүтээгдэхүүн харах',
    cartItems: 'Сагсны бүтээгдэхүүн',
    orderInfo: 'Захиалгын мэдээлэл',
    productTypes: 'төрөл',
    totalQuantity: 'Нийт тоо',
    pieces: 'ширхэг',
    shippingFee: 'Хүргэлтийн төлбөр',
    totalAmount: 'Нийт дүн',
    placeOrder: 'Захиалга хийх',
    continueShopping: 'Үргэлжлүүлэн худалдан авах',
    checkout: 'Захиалга өгөх',

    // 체크아웃 페이지
    bankTransfer: 'Банк шилжүүлэг',
    bankTransferDesc: 'Төлбөр тооцооны дараах дансанд хийнэ:',
    selectBank: 'Банк сонгоно уу',
    defaultAccount: 'Үндсэн данс',
    copyAccountNumber: 'Дансны дугаар хуулах',
    bankInfoNotFound: 'Банкны мэдээлэл олдсонгүй. Имэйлээс дансны мэдээллийг шалгана уу.',
    transferSenderName: 'Шилжүүлсэн хүний нэр',
    transferSenderNamePlaceholder: 'Нэрээ бичнэ үү',
    transferSenderNameDesc: 'Банкны шилжүүлэг хийж буй хүний нэрийг оруулна уу',
    processingPayment: 'Төлбөр баталгаажуулж байна...',

    // 장바구니 아이템
    total: 'Нийт',
    remove: 'Устгах',
    decrease: 'Хасах',
    increase: 'Нэмэх',

    // 푸터
    adminLogin: 'Админ нэвтрэх',
    copyright: '© 2025 Элбэг мах хүнс. Бүх эрх хуулиар хамгаалагдсан.',
    visitPage: 'Хаяг руу очих',

    // 마이페이지
    myPage: 'Миний хуудас',
    userInfo: 'Хэрэглэгчийн мэдээлэл',
    userInfoDesc: 'Хэрэглэгчийн болон захиалгын мэдээлэл',
    orderHistory: 'Захиалгын түүх',
    orderHistoryDesc: 'Таны захиалгын түүх',
    name: 'Нэр',
    phone: 'Утас',
    email: 'Имэйл',
    noOrders: 'Захиалгын түүх байхгүй байна',
    noOrdersDesc: 'Бүтээгдэхүүн худалдаж авахын тулд нүүр хуудас руу шилжинэ үү.',
    orderedProducts: 'Захиалсан бүтээгдэхүүн',
    deliveryInfo: 'Хүргэлтийн мэдээлэл',
    paymentInfo: 'Төлбөрийн мэдээлэл',
    recipient: 'Хүлээн авагч',
    address: 'Хаяг',
    paymentStatus: 'Төлбөрийн төлөв',
    orderNumber: 'Захиалгын дугаар',
    totalItems: 'Нийт',
    orderDate: 'Огноо',
    showMore: 'илүү үзэх...',
    showDetails: 'Дэлгэрэнгүй',
    collapse: 'Хураангуйлах',

    // 주문 상태
    orderStatus: {
      pending: 'Төлбөр төлөлт хүлээгдэж байна',
      processing: 'Төлбөр төлөгдсөн',
      completed: 'Хүргэгдсэн',
      cancelled: 'Цуцлагдсан',
    },
    bank: 'Банк',
    accountHolder: 'Эзэмшигч',
    accountNumber: 'Дансны дугаар',
    loadingBankInfo: 'Банкны данс мэдээлэл ачааллаж байна...',
    loadingOrderHistory: 'Захиалгын түүхийг ачааллаж байна...',
    retry: 'Дахин оролдох',

    // 인증
    usernameOrEmail: 'Хэрэглэгчийн нэр эсвэл И-мэйл',
    password: 'Нууц үг',
    confirmPassword: 'Нууц үг баталгаажуулах',
    username: 'Хэрэглэгчийн нэр',
    signup: 'Бүртгүүлэх',
    signUp: 'Бүртгүүлэх',
    signIn: 'Нэвтрэх',
    login: 'Нэвтрэх',
    register: 'Бүртгүүлэх',
    loggingIn: 'Нэвтэрч байна...',
    signingIn: 'Нэвтэрч байна...',
    signingUp: 'Бүртгэж байна...',
    alreadyHaveAccount: 'Хэдийн бүртгэлтэй юу?',
    noAccount: 'Бүртгэлгүй юу?',
    phoneFormat: 'Солонгос утасны дугаар хэлбэр: 010-0000-0000',
    phoneHint: 'Солонгос утасны дугаар хэлбэр: 010-0000-0000',
    authHeroTitle: 'Элбэг мах хүнс',
    authHeroDesc: 'Хэрэглэгчийн бүртгэл үүсгээд захиалгынхаа түүхийг хянаарай',
    directDelivery: 'Үсэхсэн зах руу шууд хүргэлт',
    viewOrderHistory: 'Захиалгын түүхээ харах',
    fastPayment: 'Хурдан, найдвартай төлбөр тооцоо',
    or: 'Эсвэл',
    orContinueWith: 'Эсвэл',
    continueWithGoogle: 'Google-ээр нэвтрэх',

    // 기타
    loading: 'Ачааллаж байна...',
    error: 'Алдаа гарлаа',
    success: 'Амжилттай',

    // 토스트 메시지
    toast: {
      success: 'Амжилттай',
      error: 'Алдаа',
      cartAdded: '🛒 Сагсанд нэмлээ',
      cartAddedDesc: 'сагсанд нэмэгдлээ',
      loginRequired: 'Нэвтрэх шаардлагатай',
      loginRequiredDesc: 'Бүтээгдэхүүнийг сагсанд нэмэхийн тулд нэвтрэх эсвэл бүртгүүлэх шаардлагатай.',
      addToCartError: 'Алдаа гарлаа',
      addToCartErrorDesc: 'Бүтээгдэхүүнийг сагсанд нэмэх үед алдаа гарлаа.',
      loginSuccess: 'Амжилттай нэвтэрлээ',
      loginSuccessDesc: 'Амжилттай нэвтэрлээ',
      loginSuccessWelcome: 'Сайн байна уу',
      loginFailed: 'Нэвтрэх боломжгүй',
      loginFailedDesc: 'Хэрэглэгчийн нэр эсвэл нууц үг буруу байна',
      registerSuccess: 'Бүртгэл амжилттай',
      registerSuccessDesc: 'Таны бүртгэл амжилттай үүслээ.',
      registerFailed: 'Бүртгэхэд алдаа гарлаа',
      registerFailedDesc: 'Бүртгэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.',
      logoutSuccess: 'Амжилттай гарлаа',
      logoutSuccessDesc: 'Та системээс гарлаа.',
      logoutFailed: 'Гарахад алдаа гарлаа',
      logoutFailedDesc: 'Системээс гарахад алдаа гарлаа',
    },

    // 폼 검증 메시지
    formErrors: {
      required: 'Заавал бөглөх шаардлагатай',
      invalidEmail: 'И-мэйл хаяг буруу байна',
      passwordMismatch: 'Нууц үг таарахгүй байна',
      minLength: 'Хэт богино байна',
      maxLength: 'Хэт урт байна',
      invalidPhone: 'Утасны дугаар буруу байна',
      usernameExists: 'Хэрэглэгчийн нэр аль хэдийн бүртгэлтэй байна',
      emailExists: 'И-мэйл хаяг аль хэдийн бүртгэлтэй байна'
    },

    // 모바일 네비게이션
    mobileNav: {
      home: 'Нүүр',
      cart: 'Сагс',
      profile: 'Миний мэдээлэл'
    }
  },

  ru: {
    // 공통
    home: 'Главная',
    products: 'Продукты',
    contact: 'Контакты',
    cart: 'Корзина',
    profile: 'Мой профиль',
    logout: 'Выйти',
    menu: 'Меню',
    siteTitle: 'Мясной магазин Арвижих',

    // 홈페이지
    heroTitle: 'Мясной магазин Арвижих',
    heroSubtitle: 'Не откладывай мясо, которое можно съесть сегодня, на завтра',
    featuredProducts: 'Рекомендуемые товары',
    featuredProductsDesc: 'Лучшие мясные продукты высокого качества в нашем магазине',
    categories: {
      all: 'Все',
      beef: 'Говядина',
      lamb: 'Баранина',
      chicken: 'Курица',
      pork: 'Свинина',
      other: 'Другое',
      swipeHint: 'Проведите пальцем для просмотра'
    },

    // 배송
    delivery: {
      scrolling: 'Доставка по всем городам ● Доставка по всем городам ● Доставка по всем городам ● Доставка по всем городам'
    },

    // 상품
    addToCart: 'В корзину',
    price: 'Цена',
    stock: 'В наличии',
    outOfStock: 'Нет в наличии',
    selectQuantity: 'Выбрать количество',
    quantity: 'Количество',
    packageUnit: 'Упаковкой по 4кг',
    minOrderQuantity: 'Минимум {min}кг',
    currentOrderTotal: 'Вы заказали на общую сумму {total} ₩.',
    quantityModalDesc: 'Окно выбора количества товара',

    // 장바구니
    cartEmpty: 'Ваша корзина пуста',
    cartEmptyDesc: 'Выберите товары и нажмите кнопку "Добавить в корзину".',
    viewProducts: 'Посмотреть товары',
    cartItems: 'Товары в корзине',
    orderInfo: 'Информация о заказе',
    productTypes: 'видов',
    totalQuantity: 'Общее количество',
    pieces: 'шт.',
    shippingFee: 'Стоимость доставки',
    totalAmount: 'Итого',
    placeOrder: 'Оформить заказ',
    continueShopping: 'Продолжить покупки',
    checkout: 'Оформить заказ',

    // 체크아웃 페이지
    bankTransfer: 'Банковский перевод',
    bankTransferDesc: 'Оплата будет произведена на следующий счет:',
    selectBank: 'Выберите банк',
    defaultAccount: 'Основной счет',
    copyAccountNumber: 'Скопировать номер счета',
    bankInfoNotFound: 'Информация о банке не найдена. Проверьте данные счета в email.',
    transferSenderName: 'Имя отправителя',
    transferSenderNamePlaceholder: 'Введите ваше имя',
    transferSenderNameDesc: 'Введите имя лица, осуществляющего банковский перевод',
    processingPayment: 'Подтверждение оплаты...',

    // 장바구니 아이템
    total: 'Итого',
    remove: 'Удалить',
    decrease: 'Уменьшить',
    increase: 'Увеличить',

    // 푸터
    adminLogin: 'Войти как админ',
    copyright: '© 2025 Арвижих мясной магазин. Все права защищены.',
    visitPage: 'Перейти на страницу',

    // 마이페이지
    myPage: 'Моя страница',
    userInfo: 'Информация о пользователе',
    userInfoDesc: 'Информация о пользователе и заказах',
    orderHistory: 'История заказов',
    orderHistoryDesc: 'Ваша история заказов',
    name: 'Имя',
    phone: 'Телефон',
    email: 'Email',
    noOrders: 'История заказов отсутствует',
    noOrdersDesc: 'Перейдите на главную страницу, чтобы купить товары.',
    orderedProducts: 'Заказанные товары',
    deliveryInfo: 'Информация о доставке',
    paymentInfo: 'Информация об оплате',
    recipient: 'Получатель',
    address: 'Адрес',
    paymentStatus: 'Статус оплаты',
    orderNumber: 'Номер заказа',
    totalItems: 'Всего',
    orderDate: 'Дата',
    showMore: 'больше...',
    showDetails: 'Подробнее',
    collapse: 'Свернуть',

    // 주문 상태
    orderStatus: {
      pending: 'Ожидание оплаты',
      processing: 'Оплачено',
      completed: 'Доставлено',
      cancelled: 'Отменено',
    },
    bank: 'Банк',
    accountHolder: 'Владелец',
    accountNumber: 'Номер счета',
    loadingBankInfo: 'Загрузка информации о банке...',
    loadingOrderHistory: 'Загрузка истории заказов...',
    retry: 'Повторить',

    // 인증
    usernameOrEmail: 'Имя пользователя или Email',
    password: 'Пароль',
    confirmPassword: 'Подтвердить пароль',
    username: 'Имя пользователя',
    signup: 'Регистрация',
    signUp: 'Регистрация',
    signIn: 'Войти',
    login: 'Войти',
    register: 'Регистрация',
    loggingIn: 'Вход...',
    signingIn: 'Вход...',
    signingUp: 'Регистрация...',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    noAccount: 'Нет аккаунта?',
    phoneFormat: 'Формат корейского номера: 010-0000-0000',
    phoneHint: 'Формат корейского номера: 010-0000-0000',
    authHeroTitle: 'МЯСНОЙ МАГАЗИН АРВИЖИХ',
    authHeroDesc: 'Создайте учетную запись и отслеживайте историю заказов',
    directDelivery: 'Прямая доставка на рынок',
    viewOrderHistory: 'Просмотр истории заказов',
    fastPayment: 'Быстрая и надежная оплата',
    or: 'Или',
    orContinueWith: 'Или',
    continueWithGoogle: 'Войти через Google',

    // 기타
    loading: 'Загрузка...',
    error: 'Произошла ошибка',
    success: 'Успешно',

    // 토스트 메시지
    toast: {
      success: 'Успешно',
      error: 'Ошибка',
      cartAdded: '🛒 Добавлено в корзину',
      cartAddedDesc: 'добавлено в корзину',
      loginRequired: 'Требуется вход',
      loginRequiredDesc: 'Для добавления товаров в корзину необходимо войти в систему или зарегистрироваться.',
      addToCartError: 'Произошла ошибка',
      addToCartErrorDesc: 'Ошибка при добавлении товара в корзину.',
      loginSuccess: 'Успешный вход',
      loginSuccessDesc: 'Успешный вход в систему',
      loginSuccessWelcome: 'Здравствуйте',
      loginFailed: 'Ошибка входа',
      loginFailedDesc: 'Неправильное имя пользователя или пароль',
      registerSuccess: 'Регистрация успешна',
      registerSuccessDesc: 'Ваша учетная запись успешно создана.',
      registerFailed: 'Ошибка регистрации',
      registerFailedDesc: 'Ошибка при создании учетной записи. Попробуйте еще раз.',
      logoutSuccess: 'Успешный выход',
      logoutSuccessDesc: 'Вы вышли из системы.',
      logoutFailed: 'Ошибка выхода',
      logoutFailedDesc: 'Ошибка при выходе из системы',
    },

    // 폼 검증 메시지
    formErrors: {
      required: 'Поле обязательно для заполнения',
      invalidEmail: 'Неверный адрес электронной почты',
      passwordMismatch: 'Пароли не совпадают',
      minLength: 'Слишком короткое',
      maxLength: 'Слишком длинное',
      invalidPhone: 'Неверный номер телефона',
      usernameExists: 'Имя пользователя уже зарегистрировано',
      emailExists: 'Электронная почта уже зарегистрирована'
    },

    // 모바일 네비게이션
    mobileNav: {
      home: 'Главная',
      cart: 'Корзина',
      profile: 'Мой профиль'
    }
  },

  en: {
    // 공통
    home: 'Home',
    products: 'Products',
    contact: 'Contact',
    cart: 'Cart',
    profile: 'My Profile',
    logout: 'Logout',
    menu: 'Menu',
    siteTitle: 'Arvijikh Meat Store',

    // 홈페이지
    heroTitle: 'Arvijikh Meat Store',
    heroSubtitle: 'Don\'t put off eating the meat you can enjoy today until tomorrow',
    featuredProducts: 'Featured Products',
    featuredProductsDesc: 'The finest quality meat products from our store',
    categories: {
      all: 'All',
      beef: 'Beef',
      lamb: 'Lamb',
      chicken: 'Chicken',
      pork: 'Pork',
      other: 'Other',
      swipeHint: 'Swipe to browse categories'
    },

    // 배송
    delivery: {
      scrolling: 'Delivery to all cities ● Delivery to all cities ● Delivery to all cities ● Delivery to all cities'
    },

    // 상품
    addToCart: 'Add to Cart',
    price: 'Price',
    stock: 'Stock',
    outOfStock: 'Out of Stock',
    selectQuantity: 'Select Quantity',
    quantity: 'Quantity',
    packageUnit: '4kg package only',
    minOrderQuantity: 'Minimum {min}kg',
    currentOrderTotal: 'Your current order total is {total} ₩.',
    quantityModalDesc: 'Product quantity selection dialog',

    // 장바구니
    cartEmpty: 'Your cart is empty',
    cartEmptyDesc: 'Select products and click "Add to Cart" button.',
    viewProducts: 'View Products',
    cartItems: 'Cart Items',
    orderInfo: 'Order Information',
    productTypes: 'types',
    totalQuantity: 'Total Quantity',
    pieces: 'pcs',
    shippingFee: 'Shipping Fee',
    totalAmount: 'Total Amount',
    placeOrder: 'Place Order',
    continueShopping: 'Continue Shopping',
    checkout: 'Checkout',

    // 체크아웃 페이지
    bankTransfer: 'Bank Transfer',
    bankTransferDesc: 'Payment will be made to the following account:',
    selectBank: 'Select Bank',
    defaultAccount: 'Default Account',
    copyAccountNumber: 'Copy Account Number',
    bankInfoNotFound: 'Bank information not found. Please check account details in email.',
    transferSenderName: 'Sender Name',
    transferSenderNamePlaceholder: 'Enter your name',
    transferSenderNameDesc: 'Please enter the name of the person making the bank transfer',
    processingPayment: 'Processing payment...',

    // 장바구니 아이템
    total: 'Total',
    remove: 'Remove',
    decrease: 'Decrease',
    increase: 'Increase',

    // 푸터
    adminLogin: 'Admin Login',
    copyright: '© 2025 Arvijikh Meat Store. All rights reserved.',
    visitPage: 'Visit Page',

    // 마이페이지
    myPage: 'My Page',
    userInfo: 'User Information',
    userInfoDesc: 'User and order information',
    orderHistory: 'Order History',
    orderHistoryDesc: 'Your order history',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    noOrders: 'No order history',
    noOrdersDesc: 'Go to home page to purchase products.',
    orderedProducts: 'Ordered Products',
    deliveryInfo: 'Delivery Information',
    paymentInfo: 'Payment Information',
    recipient: 'Recipient',
    address: 'Address',
    paymentStatus: 'Payment Status',
    orderNumber: 'Order Number',
    totalItems: 'Total',
    orderDate: 'Date',
    showMore: 'more...',
    showDetails: 'Details',
    collapse: 'Collapse',

    // 주문 상태
    orderStatus: {
      pending: 'Payment Pending',
      processing: 'Payment Received',
      completed: 'Delivered',
      cancelled: 'Cancelled',
    },
    bank: 'Bank',
    accountHolder: 'Account Holder',
    accountNumber: 'Account Number',
    loadingBankInfo: 'Loading bank information...',
    loadingOrderHistory: 'Loading order history...',
    retry: 'Retry',

    // 인증
    usernameOrEmail: 'Username or Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    username: 'Username',
    signup: 'Register',
    signUp: 'Register',
    signIn: 'Sign In',
    login: 'Login',
    register: 'Register',
    loggingIn: 'Logging in...',
    signingIn: 'Signing in...',
    signingUp: 'Signing up...',
    alreadyHaveAccount: 'Already have an account?',
    noAccount: 'Don\'t have an account?',
    phoneFormat: 'Korean phone format: 010-0000-0000',
    phoneHint: 'Korean phone format: 010-0000-0000',
    authHeroTitle: 'ARVIJIKH MEAT STORE',
    authHeroDesc: 'Create an account and track your order history',
    directDelivery: 'Direct delivery to market',
    viewOrderHistory: 'View order history',
    fastPayment: 'Fast and reliable payment',
    or: 'Or',
    orContinueWith: 'Or',
    continueWithGoogle: 'Continue with Google',

    // 기타
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',

    // 토스트 메시지
    toast: {
      success: 'Success',
      error: 'Error',
      cartAdded: '🛒 Added to Cart',
      cartAddedDesc: 'added to cart',
      loginRequired: 'Login Required',
      loginRequiredDesc: 'Please login or register to add items to cart.',
      addToCartError: 'Error Occurred',
      addToCartErrorDesc: 'Error adding item to cart.',
      loginSuccess: 'Login Successful',
      loginSuccessDesc: 'Successfully logged in',
      loginSuccessWelcome: 'Hello',
      loginFailed: 'Login Failed',
      loginFailedDesc: 'Incorrect username or password',
      registerSuccess: 'Registration Successful',
      registerSuccessDesc: 'Your account has been successfully created.',
      registerFailed: 'Registration Failed',
      registerFailedDesc: 'Error creating account. Please try again.',
      logoutSuccess: 'Logout Successful',
      logoutSuccessDesc: 'You have been logged out.',
      logoutFailed: 'Logout Failed',
      logoutFailedDesc: 'Error logging out of the system',
    },

    // 폼 검증 메시지
    formErrors: {
      required: 'This field is required',
      invalidEmail: 'Invalid email address',
      passwordMismatch: 'Passwords do not match',
      minLength: 'Too short',
      maxLength: 'Too long',
      invalidPhone: 'Invalid phone number',
      usernameExists: 'Username already registered',
      emailExists: 'Email already registered'
    },

    // 모바일 네비게이션
    mobileNav: {
      home: 'Home',
      cart: 'Cart',
      profile: 'My Profile'
    }
  }
};

// 언어 컨텍스트 타입
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

// 언어 컨텍스트 생성
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// 언어 프로바이더 컴포넌트
interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setCurrentLanguage] = useState<Language>('mn');

  // Force language to 'mn' regardless of previous settings
  useEffect(() => {
    localStorage.removeItem('preferred-language');
  }, []);

  // 언어 변경 함수
  const setLanguage = (lang: Language) => {
    setCurrentLanguage('mn');
    localStorage.setItem('preferred-language', 'mn');
  };

  // 현재 언어의 번역 데이터
  const t = translations[language];

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// 언어 컨텍스트 사용 훅
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// 다국어 상품 이름 가져오기 유틸리티 함수
export function getLocalizedProductName(product: any, language: Language): string {
  switch (language) {
    case 'ru':
      return product.nameRu || product.name;
    case 'en':
      return product.nameEn || product.name;
    default:
      return product.name;
  }
}

// 다국어 상품 설명 가져오기 유틸리티 함수
export function getLocalizedProductDescription(product: any, language: Language): string {
  switch (language) {
    case 'ru':
      return product.descriptionRu || product.description;
    case 'en':
      return product.descriptionEn || product.description;
    default:
      return product.description;
  }
}