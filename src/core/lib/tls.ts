import tls from 'node:tls';
import { randomBytes } from 'node:crypto';

const ORIGINAL_CIPHERS = tls.DEFAULT_CIPHERS;

// How many ciphers from the top of the list to shuffle.
// The remaining ciphers are left in the original order.
const TOP_N_SHUFFLE = 8;

// Modified variation of https://stackoverflow.com/a/12646864
const shuffleArray = (array: string[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomBytes(4).readUint32LE() % array.length;
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const CHROME_CIPHERS = [
  'TLS_AES_128_GCM_SHA256',
  'TLS_AES_256_GCM_SHA384',
  'TLS_CHACHA20_POLY1305_SHA256',
  'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
  'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
  'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
  'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
  'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
  'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
  'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
  'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
  'TLS_RSA_WITH_AES_128_GCM_SHA256',
  'TLS_RSA_WITH_AES_256_GCM_SHA384',
  'TLS_RSA_WITH_AES_128_CBC_SHA',
  'TLS_RSA_WITH_AES_256_CBC_SHA',
];

export const randomizeCiphers = () => {
  do {
    const cipherList = ORIGINAL_CIPHERS.split(':');
    const shuffled = shuffleArray(cipherList.slice(0, TOP_N_SHUFFLE));
    const retained = cipherList.slice(TOP_N_SHUFFLE);
    tls.DEFAULT_CIPHERS = [...shuffled, ...retained].join(':');
  } while (tls.DEFAULT_CIPHERS === ORIGINAL_CIPHERS);
  return tls.DEFAULT_CIPHERS;
};
