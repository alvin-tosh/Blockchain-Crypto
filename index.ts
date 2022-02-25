import * as crypto from "crypto";

class Transaction {
    constructor(
        public amount: number,
        public payer: string,  //public key
        public payee: string
    ) {}

    toString() {
        return JSON.stringify(this);
    }
}

class Block {

    public nonce = Math.round(Math.random() * 99999999999);

    constructor(
        public prevHash: string,
        public transaction: Transaction,
        public ts = Date.now()
    ) {}

    get hash() {
        const str = JSON.stringify(this);
        const hash = crypto.createHash('SHA256');
        hash.update(str).end();
        return hash.digest('hex');
    }



}

class Chain {
    public static instance = new Chain();

    chain: Block[];

    constructor() {
        this.chain = [new Block(' ', new Transaction(1000, 'genesis', 'satoshi'))];
    }

    get lastBlock() {
        return this.chain[this.chain.length - 1];
    }

    mine(nonce: number) {
        let solution = 1;
        console.log('mining...')

        while (true) {

            const hash = crypto.createHash('MD5');
            hash.update((nonce + solution).toString()).end();

            const attempt = hash.digest('hex');

            if (attempt.substring(0,4) === '0000') {
                console.log('SOLVED!: ${solution}');
                return solution;
                
            }

            solution += 1;
            
        }
    }

    addBlock(transaction: Transaction, senderPublicKey: string, signature: Buffer) {
        const verify = crypto.createVerify('SHA256');
        verify.update(transaction.toString());

        const isValid = verify.verify(senderPublicKey, signature);

        if (isValid) {
            const newBlock = new Block(this.lastBlock.hash, transaction);
            this.chain.push(newBlock);
        }
    };

}

class Wallet {
    public publicKey: string;
    public privateKey: string;

    constructor() {
        const keypair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki' , format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8' , format: 'pem' },
    });
    
    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  sendMoney(amount: number, payeePublicKey: string) {
    const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

    const sign = crypto.createSign('SHA256');
    sign.update(transaction.toString()).end();

    const signature = sign.sign(this.privateKey); 
    Chain.instance.addBlock(transaction, this.publicKey, signature);
  }
}

const satoshi = new Wallet();
const Viktor = new Wallet();
const Emma = new Wallet();

satoshi.sendMoney(250, Viktor.publicKey);
Viktor.sendMoney(70, Emma.publicKey);
Emma.sendMoney(5, Viktor.publicKey);

console.log(Chain.instance)

