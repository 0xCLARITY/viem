import type { Abi } from 'abitype'

import type { Account } from '../../accounts/types.js'
import { parseAccount } from '../../accounts/utils/parseAccount.js'
import type { Client } from '../../clients/createClient.js'
import type { Transport } from '../../clients/transports/createTransport.js'
import type { BaseError } from '../../errors/base.js'
import type { Chain } from '../../types/chain.js'
import type {
  ContractFunctionArgs,
  ContractFunctionName,
  ContractFunctionParameters,
  GetValue,
} from '../../types/contract.js'
import type { UnionOmit } from '../../types/utils.js'
import { encodeFunctionData } from '../../utils/abi/encodeFunctionData.js'
import { getContractError } from '../../utils/errors/getContractError.js'
import { type EstimateGasParameters, estimateGas } from './estimateGas.js'

export type EstimateContractGasParameters<
  abi extends Abi | readonly unknown[] = Abi,
  functionName extends ContractFunctionName<
    abi,
    'nonpayable' | 'payable'
  > = ContractFunctionName<abi, 'nonpayable' | 'payable'>,
  args extends ContractFunctionArgs<
    abi,
    'nonpayable' | 'payable',
    functionName
  > = ContractFunctionArgs<abi, 'nonpayable' | 'payable', functionName>,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = undefined,
> = ContractFunctionParameters<
  abi,
  'nonpayable' | 'payable',
  functionName,
  args
> &
  UnionOmit<EstimateGasParameters<chain, account>, 'data' | 'to' | 'value'> &
  GetValue<
    abi,
    functionName,
    EstimateGasParameters<chain> extends EstimateGasParameters
      ? EstimateGasParameters<chain>['value']
      : EstimateGasParameters['value']
  >

export type EstimateContractGasReturnType = bigint

/**
 * Estimates the gas required to successfully execute a contract write function call.
 *
 * - Docs: https://viem.sh/docs/contract/estimateContractGas.html
 *
 * Internally, uses a [Public Client](https://viem.sh/docs/clients/public.html) to call the [`estimateGas` action](https://viem.sh/docs/actions/public/estimateGas.html) with [ABI-encoded `data`](https://viem.sh/docs/contract/encodeFunctionData.html).
 *
 * @param client - Client to use
 * @param parameters - {@link EstimateContractGasParameters}
 * @returns The gas estimate (in wei). {@link EstimateContractGasReturnType}
 *
 * @example
 * import { createPublicClient, http, parseAbi } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { estimateContractGas } from 'viem/contract'
 *
 * const client = createPublicClient({
 *   chain: mainnet,
 *   transport: http(),
 * })
 * const gas = await estimateContractGas(client, {
 *   address: '0xFBA3912Ca04dd458c843e2EE08967fC04f3579c2',
 *   abi: parseAbi(['function mint() public']),
 *   functionName: 'mint',
 *   account: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
 * })
 */
export async function estimateContractGas<
  const abi extends Abi | readonly unknown[],
  functionName extends ContractFunctionName<abi, 'nonpayable' | 'payable'>,
  args extends ContractFunctionArgs<abi, 'pure' | 'view', functionName>,
  chain extends Chain | undefined,
  account extends Account | undefined = undefined,
>(
  client: Client<Transport, chain, account>,
  parameters: EstimateContractGasParameters<
    abi,
    functionName,
    args,
    chain,
    account
  >,
): Promise<EstimateContractGasReturnType> {
  const { abi, address, args, functionName, ...request } =
    parameters as EstimateContractGasParameters
  const data = encodeFunctionData({ abi, args, functionName })
  try {
    const gas = await estimateGas(client, { data, to: address, ...request })
    return gas
  } catch (error) {
    const account = request.account ? parseAccount(request.account) : undefined
    throw getContractError(error as BaseError, {
      abi,
      address,
      args,
      docsPath: '/docs/contract/estimateContractGas',
      functionName,
      sender: account?.address,
    })
  }
}
