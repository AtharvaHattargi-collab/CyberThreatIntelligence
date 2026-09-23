import React, { useState } from 'react';
import { Database, Search, ShieldAlert, Cpu } from 'lucide-react';
import MetricCard from '../components/ui/MetricCard';

const featureDictionary = [
  { name: 'srcip', type: 'nominal', desc: 'Source IP address', role: 'Identifier' },
  { name: 'sport', type: 'integer', desc: 'Source port number', role: 'Identifier' },
  { name: 'dstip', type: 'nominal', desc: 'Destination IP address', role: 'Identifier' },
  { name: 'dsport', type: 'integer', desc: 'Destination port number', role: 'Identifier' },
  { name: 'proto', type: 'nominal', desc: 'Transaction protocol', role: 'Categorical' },
  { name: 'state', type: 'nominal', desc: 'Indicates to the state and its dependent protocol', role: 'Categorical' },
  { name: 'dur', type: 'float', desc: 'Record total duration', role: 'Numeric' },
  { name: 'sbytes', type: 'integer', desc: 'Source to destination transaction bytes', role: 'Numeric' },
  { name: 'dbytes', type: 'integer', desc: 'Destination to source transaction bytes', role: 'Numeric' },
  { name: 'sttl', type: 'integer', desc: 'Source to destination time to live value', role: 'Numeric' },
  { name: 'dttl', type: 'integer', desc: 'Destination to source time to live value', role: 'Numeric' },
  { name: 'sloss', type: 'integer', desc: 'Source packets retransmitted or dropped', role: 'Numeric' },
  { name: 'dloss', type: 'integer', desc: 'Destination packets retransmitted or dropped', role: 'Numeric' },
  { name: 'service', type: 'nominal', desc: 'http, ftp, smtp, ssh, dns, ftp-data ,irc and (-) if not much used service', role: 'Categorical' },
  { name: 'Sload', type: 'float', desc: 'Source bits per second', role: 'Numeric' },
  { name: 'Dload', type: 'float', desc: 'Destination bits per second', role: 'Numeric' },
  { name: 'Spkts', type: 'integer', desc: 'Source to destination packet count', role: 'Numeric' },
  { name: 'Dpkts', type: 'integer', desc: 'Destination to source packet count', role: 'Numeric' },
  { name: 'swin', type: 'integer', desc: 'Source TCP window advertisement value', role: 'Numeric' },
  { name: 'dwin', type: 'integer', desc: 'Destination TCP window advertisement value', role: 'Numeric' },
  { name: 'stcpb', type: 'integer', desc: 'Source TCP base sequence number', role: 'Numeric' },
  { name: 'dtcpb', type: 'integer', desc: 'Destination TCP base sequence number', role: 'Numeric' },
  { name: 'smeansz', type: 'integer', desc: 'Mean of the flow packet size transmitted by the src', role: 'Numeric' },
  { name: 'dmeansz', type: 'integer', desc: 'Mean of the flow packet size transmitted by the dst', role: 'Numeric' },
  { name: 'trans_depth', type: 'integer', desc: 'Represents the pipelined depth into the connection of http request/response transaction', role: 'Numeric' },
  { name: 'res_bdy_len', type: 'integer', desc: 'Actual uncompressed content size of the data transferred from the servers HTTP service', role: 'Numeric' },
  { name: 'Sjit', type: 'float', desc: 'Source jitter (mSec)', role: 'Numeric' },
  { name: 'Djit', type: 'float', desc: 'Destination jitter (mSec)', role: 'Numeric' },
  { name: 'Stime', type: 'timestamp', desc: 'Record start time', role: 'Timestamp' },
  { name: 'Ltime', type: 'timestamp', desc: 'Record last time', role: 'Timestamp' },
  { name: 'Sintpkt', type: 'float', desc: 'Source interpacket arrival time (mSec)', role: 'Numeric' },
  { name: 'Dintpkt', type: 'float', desc: 'Destination interpacket arrival time (mSec)', role: 'Numeric' },
  { name: 'tcprtt', type: 'float', desc: 'TCP connection setup round-trip time, the sum of synack and ackdat', role: 'Numeric' },
  { name: 'synack', type: 'float', desc: 'TCP connection setup time, the time between the SYN and the SYN_ACK packets', role: 'Numeric' },
  { name: 'ackdat', type: 'float', desc: 'TCP connection setup time, the time between the SYN_ACK and the ACK packets', role: 'Numeric' },
  { name: 'is_sm_ips_ports', type: 'binary', desc: 'If source and destination IP addresses and port numbers are equal, this variable takes value 1 else 0', role: 'Binary' },
  { name: 'ct_state_ttl', type: 'integer', desc: 'No. for each state according to specific range of values for source/destination time to live', role: 'Numeric' },
  { name: 'ct_flw_http_mthd', type: 'integer', desc: 'No. of flows that has methods such as Get and Post in http service', role: 'Numeric' },
  { name: 'is_ftp_login', type: 'binary', desc: 'If the ftp session is accessed by user and password then 1 else 0', role: 'Binary' },
  { name: 'ct_ftp_cmd', type: 'integer', desc: 'No of flows that has a command in ftp session', role: 'Numeric' },
  { name: 'ct_srv_src', type: 'integer', desc: 'No. of connections that contain the same service and source address in 100 connections according to the last time', role: 'Numeric' },
  { name: 'ct_srv_dst', type: 'integer', desc: 'No. of connections that contain the same service and destination address in 100 connections according to the last time', role: 'Numeric' },
  { name: 'ct_dst_ltm', type: 'integer', desc: 'No. of connections of the same destination address in 100 connections according to the last time', role: 'Numeric' },
  { name: 'ct_src_ltm', type: 'integer', desc: 'No. of connections of the same source address in 100 connections according to the last time', role: 'Numeric' },
  { name: 'ct_src_dport_ltm', type: 'integer', desc: 'No of connections of the same source address and the destination port in 100 connections according to the last time', role: 'Numeric' },
  { name: 'ct_dst_sport_ltm', type: 'integer', desc: 'No of connections of the same destination address and the source port in 100 connections according to the last time', role: 'Numeric' },
  { name: 'ct_dst_src_ltm', type: 'integer', desc: 'No of connections of the same source and the destination address in 100 connections according to the last time', role: 'Numeric' },
  { name: 'attack_cat', type: 'nominal', desc: 'The name of each attack category. In this data set, nine categories e.g. Fuzzers, Analysis, Backdoors, DoS, Exploits, Generic, Reconnaissance, Shellcode and Worms', role: 'Label' },
  { name: 'Label', type: 'binary', desc: '0 for normal and 1 for attack records', role: 'Label' }
];

export default function DatasetExplorer() {
  const [search, setSearch] = useState('');

  const filteredFeatures = featureDictionary.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-primary">UNSW-NB15 Dataset Explorer</h2>
        <p className="text-sm text-text-secondary mt-1 max-w-3xl">
          The UNSW-NB15 dataset was created by the IXIA PerfectStorm tool in the Cyber Range Lab of UNSW Canberra. 
          It contains a hybrid of real modern normal activities and synthetic contemporary attack behaviours.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Training Records" value="175,341" icon={Database} />
        <MetricCard label="Testing Records" value="82,332" icon={Database} />
        <MetricCard label="Total Features" value="49" icon={Cpu} accent />
        <MetricCard label="Attack Categories" value="9" icon={ShieldAlert} />
      </div>

      <div className="card p-0 overflow-hidden flex flex-col h-[600px]">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface">
          <div>
            <h3 className="text-base font-semibold text-text-primary">Feature Dictionary</h3>
            <p className="text-xs text-text-secondary mt-0.5">Comprehensive list of all network flow features</p>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search features..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 text-sm w-full sm:w-64"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface sticky top-0 shadow-sm z-10">
              <tr className="border-b border-border text-[11px] text-text-secondary uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-medium">Feature Name</th>
                <th className="px-5 py-3 text-left font-medium">Data Type</th>
                <th className="px-5 py-3 text-left font-medium">Role</th>
                <th className="px-5 py-3 text-left font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {filteredFeatures.map((f, i) => (
                <tr key={i} className="hover:bg-surface-hover transition-colors">
                  <td className="px-5 py-3 font-mono text-primary font-medium text-xs">{f.name}</td>
                  <td className="px-5 py-3 text-text-secondary text-xs">{f.type}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${f.role === 'Label' ? 'bg-warning/10 text-warning border-warning/20' : f.role === 'Numeric' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-hover text-text-secondary border-border'}`}>
                      {f.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-primary text-xs max-w-md">{f.desc}</td>
                </tr>
              ))}
              {filteredFeatures.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-text-secondary text-sm">No features match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
