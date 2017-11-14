import * as yargs from 'yargs';
import * as path from 'path';
import {CompilerOptions, DeployerOptions} from './src/utils/types';
import {getNetworkIdIfExistsAsync} from './src/utils/network';
import {commands} from './src/commands';

const DEFAULT_OPTIMIZER_ENABLED = false;
const DEFAULT_CONTRACTS_DIR = path.resolve('contracts');
const DEFAULT_ARTIFACTS_DIR = `${path.resolve('build')}/artifacts/`;
const DEFAULT_NETWORK_ID = 50;
const DEFAULT_JSONRPC_PORT = 8545;
const DEFAULT_GAS_PRICE = '20000000000';

/**
 * Compiles all contracts with options passed in through CLI.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onCompileCommand(args: any): Promise<void> {
    const opts: CompilerOptions = {
        contractsDir: args.contractsDir,
        networkId: args.networkId,
        optimizerEnabled: args.optimize ? 1 : 0,
        artifactsDir: args.artifactsDir,
    };
    await commands.compileAsync(opts);
}
/**
 * Compiles all contracts and runs migration script with options passed in through CLI.
 * Uses network ID of running node.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onMigrateCommand(argv: any): Promise<void> {
    const networkIdIfExists = await getNetworkIdIfExistsAsync(argv.jsonrpcPort);
    const compilerOpts: CompilerOptions = {
        contractsDir: argv.contractsDir,
        networkId: networkIdIfExists,
        optimizerEnabled: argv.optimize ? 1 : 0,
        artifactsDir: argv.artifactsDir,
    };
    await commands.compileAsync(compilerOpts);

    const defaults = {
        gasPrice: argv.gasPrice,
        from: argv.account,
    };
    const deployerOpts: DeployerOptions = {
        artifactsDir: argv.artifactsDir,
        jsonrpcPort: argv.jsonrpcPort,
        networkId: networkIdIfExists,
        defaults,
    };
    await commands.migrateAsync(deployerOpts);
}
/**
 * Deploys a single contract with provided name and args.
 * @param argv Instance of process.argv provided by yargs.
 */
async function onDeployCommand(argv: any): Promise<void> {
    const networkIdIfExists = await getNetworkIdIfExistsAsync(argv.jsonrpcPort);
    const compilerOpts: CompilerOptions = {
        contractsDir: argv.contractsDir,
        networkId: networkIdIfExists,
        optimizerEnabled: argv.optimize ? 1 : 0,
        artifactsDir: argv.artifactsDir,
    };
    await commands.compileAsync(compilerOpts);

    const defaults = {
        gasPrice: argv.gasPrice,
        from: argv.account,
    };
    const deployerOpts: DeployerOptions = {
        artifactsDir: argv.artifactsDir,
        jsonrpcPort: argv.jsonrpcPort,
        networkId: networkIdIfExists,
        defaults,
    };
    const deployerArgsString = argv.args;
    const deployerArgs = deployerArgsString.split(',');
    await commands.deployAsync(argv.contract, deployerArgs, deployerOpts);
}
/**
 * Builder function is expected for command argument, but not needed in this context.
 */
function voidCommandBuilder(): void {
    return;
}
/**
 * Provides extra required options for deploy command.
 * @param yargs yargs instance provided in builder function callback.
 */
function deployCommandBuilder(yargs: any) {
    return yargs
        .option('contract', {
            type: 'string',
            description: 'name of contract to deploy, exluding .sol extension',
        })
        .option('args', {
            type: 'string',
            description: 'comma separated list of constructor args to deploy contract with',
        })
        .demandOption(['contract', 'args'])
        .help()
        .argv;
}

yargs
    .option('contracts-dir', {
        type: 'string',
        default: DEFAULT_CONTRACTS_DIR,
        description: 'path of contracts directory to compile',
    })
    .option('network-id', {
        type: 'number',
        default: DEFAULT_NETWORK_ID,
        description: 'mainnet=1, kovan=42, testrpc=50',
    })
    .option('optimize', {
        type: 'boolean',
        default: DEFAULT_OPTIMIZER_ENABLED,
        description: 'enable optimizer',
    })
    .option('artifacts-dir', {
        type: 'string',
        default: DEFAULT_ARTIFACTS_DIR,
        description: 'path to write contracts artifacts to',
    })
    .option('jsonrpc-port', {
        type: 'number',
        default: DEFAULT_JSONRPC_PORT,
        description: 'port connected to JSON RPC',
    })
    .option('gas-price', {
        type: 'string',
        default: DEFAULT_GAS_PRICE,
        description: 'gasPrice to be used for transactions',
    })
    .option('account', {
        type: 'string',
        description: 'account to use for deploying contracts',
    })
    .command('compile',
    'compile contracts',
    voidCommandBuilder,
    onCompileCommand)
    .command('migrate',
    'compile an deploy contracts using migration scripts',
    voidCommandBuilder,
    onMigrateCommand)
    .command('deploy',
    'deploy a single contract with provided arguments',
    deployCommandBuilder,
    onDeployCommand)
    .help()
    .argv;
