import { describe, expect, it } from 'vitest';
import { varsOf } from './vars';

describe('Proměnné v příkazech', () => {
  it('zvýrazní hodnoty ze zadání', () => {
    expect(varsOf('gluster volume create app replica 3 brick01:/srv/gluster brick02:/srv/gluster force')).toEqual(['app', 'brick01', '/srv/gluster', 'brick02', '/srv/gluster']);
    expect(varsOf('brick01:/app /mnt/data glusterfs defaults,_netdev 0 0')).toEqual(['brick01', '/app', '/mnt/data']);
    expect(varsOf('ip address 192.168.10.1 255.255.255.0')).toEqual(['192.168.10.1', '255.255.255.0']);
    expect(varsOf('hostname R1')).toEqual(['R1']);
    expect(varsOf('usermod -aG ucetni jan')).toEqual(['ucetni', 'jan']);
    expect(varsOf('docker run -d --name db -v data:/var/lib/mysql mysql')).toEqual(['db', 'data']);
  });
  it('pevné části nechá být', () => {
    expect(varsOf('ip route 0.0.0.0 0.0.0.0 10.0.0.1')).toEqual(['10.0.0.1']);
    expect(varsOf('usermod -aG sudo jan')).toEqual(['jan']);
    expect(varsOf('curl http://localhost:8080')).toEqual([]);
    expect(varsOf('cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local')).toEqual([]);
    expect(varsOf('Install-WindowsFeature -Name Hyper-V -IncludeManagementTools')).toEqual([]);
    expect(varsOf('gluster volume info\ngluster volume status')).toEqual([]);
    expect(varsOf('127.0.1.1   node01')).toEqual(['node01']);
  });
});
