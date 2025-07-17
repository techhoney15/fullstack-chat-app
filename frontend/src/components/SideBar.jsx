import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import { Users } from "lucide-react";
import SidebarSkeleton from "./skeletons/SideBarSkeleton";

const PAGE_SIZE = 10;

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
  } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [isPaginating, setIsPaginating] = useState(false);

  // To keep track of all loaded users
  const [allUsers, setAllUsers] = useState([]);
  const observer = useRef();

  // Fetch users for the current page
  useEffect(() => {
    let ignore = false;
    setIsPaginating(true);
    getUsers(page, PAGE_SIZE).then(() => {
      setIsPaginating(false);
    });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line
  }, [page]);

  // Merge users as we paginate
  useEffect(() => {
    if (users?.data) {
      setAllUsers((prev) => {
        // Avoid duplicates
        const ids = new Set(prev.map((u) => u._id));
        const merged = [...prev];
        users.data.forEach((u) => {
          if (!ids.has(u._id)) merged.push(u);
        });
        return merged;
      });
    }
  }, [users?.data]);

  // Reset on mount/unmount
  useEffect(() => {
    setPage(1);
    setAllUsers([]);
    // eslint-disable-next-line
  }, []);

  // Filtered users for "show online only"
  const filteredUsers = showOnlineOnly
    ? allUsers.filter((user) => onlineUsers.includes(user._id))
    : allUsers;

  // Infinite scroll observer
  const lastUserRef = useCallback(
    (node) => {
      if (isUsersLoading || isPaginating) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          users?.pagination?.page < users?.pagination?.totalPages
        ) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isUsersLoading, isPaginating, users?.pagination]
  );

  if (isUsersLoading && page === 1) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block capitalize">
            Contacts
          </span>
        </div>
        {/* Online filter toggle */}
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm capitalize">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            {/* ({onlineUsers.length - 1} online) */}
          </span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user, idx) => {
          const isLast = idx === filteredUsers.length - 1;
          return (
            <button
              key={user._id}
              ref={isLast ? lastUserRef : null}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${
                  selectedUser?._id === user._id
                    ? "bg-base-300 ring-1 ring-base-300"
                    : ""
                }
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>
              {/* User info - only visible on larger screens */}
              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate capitalize">
                  {user.fullName}
                </div>
                <div className="text-xs text-zinc-400 capitalize mt-0.5">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          );
        })}
        {/* Show loading spinner at the end if more pages exist */}
        {users?.pagination?.page < users?.pagination?.totalPages && (
          <div className="flex justify-center py-2">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4 capitalize">
            No online users
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
