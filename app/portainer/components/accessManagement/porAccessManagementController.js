import _ from 'lodash-es';

import angular from 'angular';

class PorAccessManagementController {
  /* @ngInject */
  constructor(Notifications, ExtensionService, AccessService, RoleService) {
    this.Notifications = Notifications;
    this.ExtensionService = ExtensionService;
    this.AccessService = AccessService;
    this.RoleService = RoleService;

    this.unauthorizeAccess = this.unauthorizeAccess.bind(this);
    this.updateAction = this.updateAction.bind(this);
  }

  updateAction() {
    const entity = this.accessControlledEntity;
    const oldUserAccessPolicies = entity.UserAccessPolicies;
    const oldTeamAccessPolicies = entity.TeamAccessPolicies;
    const updatedUserAccesses = _.filter(this.authorizedUsersAndTeams, { Updated: true, Type: 'user', Inherited: false });
    const updatedTeamAccesses = _.filter(this.authorizedUsersAndTeams, { Updated: true, Type: 'team', Inherited: false });

    const accessPolicies = this.AccessService.generateAccessPolicies(oldUserAccessPolicies, oldTeamAccessPolicies, updatedUserAccesses, updatedTeamAccesses);
    this.accessControlledEntity.UserAccessPolicies = accessPolicies.userAccessPolicies;
    this.accessControlledEntity.TeamAccessPolicies = accessPolicies.teamAccessPolicies;
    this.updateAccess();
  }

  authorizeAccess() {
    const entity = this.accessControlledEntity;
    const oldUserAccessPolicies = entity.UserAccessPolicies;
    const oldTeamAccessPolicies = entity.TeamAccessPolicies;
    const selectedRoleId = this.rbacEnabled ? this.formValues.selectedRole.Id : 0;
    const selectedUserAccesses = _.filter(this.formValues.multiselectOutput, (access) => access.Type === 'user');
    const selectedTeamAccesses = _.filter(this.formValues.multiselectOutput, (access) => access.Type === 'team');

    const accessPolicies = this.AccessService.generateAccessPolicies(oldUserAccessPolicies, oldTeamAccessPolicies, selectedUserAccesses, selectedTeamAccesses, selectedRoleId);
    this.accessControlledEntity.UserAccessPolicies = accessPolicies.userAccessPolicies;
    this.accessControlledEntity.TeamAccessPolicies = accessPolicies.teamAccessPolicies;
    this.updateAccess();
  }

  unauthorizeAccess(selectedAccesses) {
    const entity = this.accessControlledEntity;
    const userAccessPolicies = entity.UserAccessPolicies;
    const teamAccessPolicies = entity.TeamAccessPolicies;
    const selectedUserAccesses = _.filter(selectedAccesses, (access) => access.Type === 'user');
    const selectedTeamAccesses = _.filter(selectedAccesses, (access) => access.Type === 'team');
    _.forEach(selectedUserAccesses, (access) => delete userAccessPolicies[access.Id]);
    _.forEach(selectedTeamAccesses, (access) => delete teamAccessPolicies[access.Id]);
    this.updateAccess();
  }

  async $onInit() {
    try {
      const entity = this.accessControlledEntity;
      const parent = this.inheritFrom;
      // TODO: refactor
      // extract this code and locate it in AccessService.accesses() function
      // see resourcePoolAccessController for another usage of AccessService.accesses()
      // which needs RBAC support
      this.roles = [];
      this.rbacEnabled = await this.ExtensionService.extensionEnabled(this.ExtensionService.EXTENSIONS.RBAC);
      if (this.rbacEnabled) {
        this.roles = await this.RoleService.roles();
        this.formValues = {
          selectedRole: this.roles[0],
        };
      }
      const data = await this.AccessService.accesses(entity, parent, this.roles);
      this.availableUsersAndTeams = _.orderBy(data.availableUsersAndTeams, 'Name', 'asc');
      this.authorizedUsersAndTeams = data.authorizedUsersAndTeams;
    } catch (err) {
      this.availableUsersAndTeams = [];
      this.authorizedUsersAndTeams = [];
      this.Notifications.error('Failure', err, 'Unable to retrieve accesses');
    }
  }
}

export default PorAccessManagementController;
angular.module('portainer.app').controller('porAccessManagementController', PorAccessManagementController);
